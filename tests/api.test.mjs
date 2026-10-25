import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { apiRequest, apiCollection, ApiError, setAccessToken, setUnauthorizedHandler } from '../src/lib/apiClient.ts'
import { mapPatient, patientBody, createPatient, updatePatient } from '../src/features/patients/services/patientService.ts'
import { mapMeasurement, listMeasurements, listThresholds } from '../src/features/measurements/services/measurementService.ts'
import { mapAlert, listAlerts, closeAlert } from '../src/features/alerts/services/alertService.ts'
import { mapMessage, sendMessage, listMessages, openConversation } from '../src/features/messaging/services/messagingService.ts'
import { addNote } from '../src/features/notes/services/noteService.ts'
import { updateProfile } from '../src/features/profile/services/profileService.ts'
import { logout, restoreSession, login } from '../src/features/auth/services/authService.ts'
import { startCall, onCallAnswered } from '../src/features/messaging/services/callService.ts'
import { validatePatientValues, patientFormFields } from '../src/features/patients/hooks/usePatientForm.ts'
import { meetsPasswordRules, PASSWORD_MAX_LENGTH } from '../src/features/auth/passwordRules.ts'

const stored = new Map()
globalThis.sessionStorage = {
  getItem: key => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, value),
  removeItem: key => stored.delete(key),
}
const json = (data, status = 200) => new Response(JSON.stringify(data), { status })
const patientDto = {
  id: 'patient-1', numeroPatient: 'PAT-001', nom: 'Test', prenoms: 'Alice', sexe: 'FEMININ',
  dateNaissance: '1980-05-01', telephone: '+22890000000', pathologie: null, dateCreation: '2026-10-24T10:00:00Z',
  professionnelId: 'doctor-1', personneAContacter: 'Contact Test', telephoneUrgence: '+22890000001',
  consentementAccepte: false, ville: 'Ville test', tailleCm: 170,
}
beforeEach(() => {
  stored.clear(); setAccessToken(null); setUnauthorizedHandler(null)
  globalThis.fetch = async () => { throw new Error('Unexpected request') }
})

test('new passwords use the same 12-character and 72-byte policy as the API', () => {
  assert.equal(PASSWORD_MAX_LENGTH, 72)
  assert.equal(meetsPasswordRules('Abcdefg1'), false)
  assert.equal(meetsPasswordRules('Abcdefghijk1'), true)
  assert.equal(meetsPasswordRules('A1' + 'x'.repeat(70)), true)
  assert.equal(meetsPasswordRules('A1' + 'x'.repeat(71)), false)
  assert.equal(meetsPasswordRules('A1' + 'é'.repeat(35)), true)
  assert.equal(meetsPasswordRules('A1' + 'é'.repeat(36)), false)
  assert.equal(meetsPasswordRules('é'.repeat(11) + '1'), false)
})

test('closure author is distinct from the assigned clinician and unknown history is not misattributed', () => {
  const dto = {
    id:'alert-author', patientId:'patient-1', patientNom:'Patient Test', numeroPatient:'PAT-001',
    titre:'Alerte test', description:'', valeurPrincipale:130, valeurSecondaire:95, unite:'mmHg',
    niveauPriorite:'ELEVE', statut:'CLOTUREE', dateCreation:'2026-10-24T10:00:00Z',
    dateCloture:'2026-10-24T11:00:00Z', motifCloture:'Vérification réalisée',
    professionnelNom:'Médecin affecté A', auteurClotureNom:'Médecin intervenant B',
  }
  assert.equal(mapAlert(dto).resolution.closedBy, 'Médecin intervenant B')
  assert.equal(mapAlert({ ...dto, auteurClotureNom:undefined }).resolution.closedBy, 'Professionnel non renseigné')
})

test('creation requires initial password, physician and emergency contact; clinical facts remain optional', () => {
  const values = { ...Object.fromEntries(patientFormFields.map(field => [field, ''])), firstName:'Alice', lastName:'Test', birthDate:'1980-05-01', sex:'N', email:'test@example.test', professionalId:'doctor', password:'InitialPass1234', emergencyContactName:'Contact Test', emergencyContactPhone:'+22890000001' }
  assert.deepEqual(validatePatientValues(values, true), {})
  const invalid = validatePatientValues({ ...values, emergencyContactName:'', emergencyContactPhone:'', password:'short', professionalId:'' }, true)
  for (const key of ['emergencyContactName','emergencyContactPhone','professionalId','password']) assert.ok(invalid[key])
  assert.equal(validatePatientValues({ ...values, password:'' }, false).password, undefined)
  assert.ok(validatePatientValues({ ...values, email:'', phone:'' }, true).phone)
})

test('patient DTO maps optional pathology, four sexes, assignment and emergency contact', () => {
  const patient = mapPatient(patientDto)
  assert.equal(patient.condition, '')
  assert.equal(patient.sex, 'F')
  assert.equal(patient.professionalId, 'doctor-1')
  assert.equal(patient.emergencyContactName, 'Contact Test')
  assert.equal(patient.heightCm, '170')
  assert.equal(mapPatient({ ...patientDto, sexe: 'AUTRE' }).sex, 'A')
  assert.equal(mapPatient({ ...patientDto, sexe: 'NON_RENSEIGNE' }).sex, 'N')
  assert.equal(mapPatient({ ...patientDto, telephone: null }).phone, '')
  const payload = patientBody({ ...patient, password: 'InitialPass1234' })
  assert.equal(payload.motDePasse, 'InitialPass1234')
  assert.equal(payload.consentementAccepte, false)
  assert.equal(payload.pathologie, null)
  assert.equal(payload.tailleCm, 170)
  assert.equal(payload.professionnelId, 'doctor-1')
})

test('doctor can initiate a conversation for the authorized patient; refusals propagate', async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, '/api/v1/mobile/conversations')
    assert.equal(init.method, 'POST')
    assert.deepEqual(JSON.parse(init.body), { patientId: 'patient-1' })
    return json({ id: 'server-conversation' }, 201)
  }
  assert.equal((await openConversation('patient-1')).id, 'server-conversation')
  globalThis.fetch = async () => json({ detail: 'Affectation requise' }, 403)
  await assert.rejects(openConversation('patient-2'), error => error.status === 403)
})

test('server threshold reads retain low and diastolic bounds, severity and provenance', async () => {
  const rules = [{ id:'low', typeMesure:'GLYCEMIE', composante:'PRINCIPALE', unite:'mg/dL', operateur:'<', seuilMin:70, seuilMax:null, niveauPriorite:'CRITIQUE', patientId:'patient-1', contexteMesure:null }, { id:'dia', typeMesure:'TENSION_ARTERIELLE', composante:'DIASTOLIQUE', unite:'mmHg', operateur:'>', seuilMin:90, seuilMax:null, niveauPriorite:'ELEVE', patientId:null, contexteMesure:null }]
  globalThis.fetch = async url => { assert.equal(url, '/api/v1/portail/patients/patient-1/seuils'); return json(rules) }
  assert.deepEqual(await listThresholds('patient-1'), rules)
})

test('disabled legacy call service never returns a fictional successful result', async () => {
  await assert.rejects(startCall('c', 'audio'), /pas disponibles/)
  let answered = false
  assert.throws(() => onCallAnswered({}, () => { answered = true }), /pas disponibles/)
  assert.equal(answered, false)
})

test('logout invalidates an anonymous login already in flight', async () => {
  let finish
  globalThis.fetch = async url => url.endsWith('/auth/connexion') ? new Promise(resolve => { finish = resolve }) : new Response(null, { status: 204 })
  const pendingLogin = login({ identifier:'test@example.test', password:'InitialPass1234' })
  logout()
  finish(json({ jeton:'unused', expireLe:'2099-01-01T00:00:00Z', profil:{ id:'A', nom:'Test', prenoms:'Compte' } }))
  await assert.rejects(pendingLogin, /Session modifiée/)
  assert.equal(stored.has('ecare.session'), false)
})

test('admin PATCH omits clinical fields and keeps real server identity', async () => {
  const patient = mapPatient(patientDto)
  let body
  globalThis.fetch = async (url, init) => {
    assert.equal(url, '/api/v1/portail/patients/patient-1')
    assert.equal(init.method, 'PATCH'); body = JSON.parse(init.body)
    return json({ ...patientDto, nom: 'Enregistré' })
  }
  assert.equal((await updatePatient(patient.id, patient, patient)).lastName, 'Enregistré')
  for (const key of ['pathologie', 'allergies', 'antecedents', 'groupeSanguin', 'tailleCm', 'poidsKg']) assert.equal(key in body, false, key)
  assert.equal(body.personneAContacter, 'Contact Test')
  assert.equal('professionnelId' in body, false)
  await updatePatient(patient.id, {...patient,professionalId:'doctor-2'},patient)
  assert.equal(body.professionnelId,'doctor-2')
})

test('canonical mg/dL is converted exactly once for g/L display; all six kinds map', () => {
  const dto = { id: 'm1', patientId: 'p1', typeMesure: 'GLYCEMIE', valeurPrincipale: 65, unite: 'mg/dL', dateMesure: '2026-10-24T10:00:00Z', source: 'APPAREIL_CONNECTE' }
  assert.equal(mapMeasurement(dto).value, 0.65)
  assert.equal(mapMeasurement(dto).source, 'APPAREIL_CONNECTE')
  assert.equal(mapMeasurement(dto).context, 'non_precise')
  assert.throws(() => mapMeasurement({ ...dto, unite: 'g/L' }), /Unité/)
  for (const [typeMesure, kind] of [['TENSION_ARTERIELLE', 'tension'], ['POIDS', 'poids'], ['FREQUENCE_CARDIAQUE', 'frequence_cardiaque'], ['TEMPERATURE', 'temperature'], ['SPO2', 'spo2']]) {
    const mapped = mapMeasurement({ ...dto, typeMesure, valeurSecondaire: 90 })
    assert.equal(mapped.kind, kind)
    if (kind === 'tension') assert.equal(mapped.diastolic, 90)
  }
})

test('pagination loads subsequent real pages and joins bearer token', async () => {
  setAccessToken('token-A')
  const urls = []
  globalThis.fetch = async (url, init) => {
    urls.push(url); assert.equal(init.headers.Authorization, 'Bearer token-A')
    return json({ content: [urls.length], totalPages: 3 })
  }
  assert.deepEqual(await apiCollection('/portail/patients'), [1, 2, 3])
  assert.match(urls[2], /page=2&size=100/)
})

test('real errors propagate, including validation fields, 403 and 409; no fake creation succeeds', async () => {
  for (const status of [400, 403, 409, 500]) {
    globalThis.fetch = async () => json({ detail: 'Refus serveur', erreurs: [{ champ: 'telephone', message: 'invalide' }] }, status)
    await assert.rejects(createPatient(mapPatient(patientDto)), error => error instanceof ApiError && error.status === status && /telephone/.test(error.message))
  }
  globalThis.fetch = async () => { throw new TypeError('Network unavailable') }
  await assert.rejects(listMeasurements('patient-1'), /Network unavailable/)
})

test('late successes and 401 from account A never expose data or log account B out', async () => {
  setAccessToken('A')
  let finish, unauthorized = 0
  globalThis.fetch = () => new Promise(resolve => { finish = resolve })
  setUnauthorizedHandler(() => unauthorized++)
  const pending = apiRequest('/portail/patients')
  setAccessToken('B'); finish(json({ secret: 'A' }))
  await assert.rejects(pending, /Session modifiée/)
  setAccessToken('A')
  const old401 = apiRequest('/portail/patients')
  setAccessToken('B'); finish(json({ detail: 'Old token' }, 401))
  await assert.rejects(old401, /Session modifiée/)
  assert.equal(unauthorized, 0)
})

test('current 401 expires the session even with a non-JSON proxy body', async () => {
  setAccessToken('A'); let expired = false
  setUnauthorizedHandler(() => { expired = true; setAccessToken(null) })
  globalThis.fetch = async () => new Response('Unauthorized', { status: 401 })
  await assert.rejects(apiRequest('/compte'), error => error.status === 401)
  assert.equal(expired, true)
})

test('logout attempts backend revocation and clears local session on network failure', async () => {
  setAccessToken('A'); stored.set('ecare.session', 'old session')
  let called = false
  globalThis.fetch = async (url, init) => {
    called = true; assert.equal(url, '/api/v1/auth/deconnexion'); assert.equal(init.method, 'POST')
    assert.equal(init.headers.Authorization, 'Bearer A'); throw new Error('offline')
  }
  logout(); assert.equal(called, true); assert.equal(stored.has('ecare.session'), false)
  await new Promise(resolve => setImmediate(resolve))
  globalThis.fetch = async (_url, init) => { assert.equal(init.headers.Authorization, undefined); return json({}) }
  await apiRequest('/compte')
})

test('an invalid or expired stored expiry never restores a session', () => {
  for (const expiresAt of ['invalid date', '2000-01-01T00:00:00Z']) {
    stored.set('ecare.session', JSON.stringify({ token: 'A', expiresAt, user: { id: 'A', name: 'Test', role: 'medecin' } }))
    assert.equal(restoreSession(), null)
  }
})

test('alerts preserve every severity, prioritize critical events, and close only on server acknowledgement', async () => {
  const dto = { id: 'a', patientId: 'p', patientNom: 'Test', numeroPatient: 'PAT-1', titre: 'Mesure à vérifier', valeurPrincipale: 65, unite: 'mg/dL', niveauPriorite: 'CRITIQUE', statut: 'NOUVELLE', dateCreation: '2026-10-20T10:00:00Z' }
  for (const [niveauPriorite, priority] of [['FAIBLE', 'faible'], ['MOYEN', 'moyenne'], ['ELEVE', 'haute'], ['CRITIQUE', 'critique']]) assert.equal(mapAlert({ ...dto, niveauPriorite }).priority, priority)
  globalThis.fetch = async () => json({ totalPages: 1, content: [{ ...dto, id: 'new-medium', niveauPriorite: 'MOYEN', dateCreation: '2026-10-24T10:00:00Z' }, dto] })
  assert.equal((await listAlerts())[0].priority, 'critique')
  globalThis.fetch = async (_url, init) => { assert.deepEqual(JSON.parse(init.body), { motifCloture: 'Contact établi' }); return json({ ...dto, statut: 'CLOTUREE', dateCloture: '2026-10-24T11:00:00Z', motifCloture: 'Contact établi', professionnelNom: 'Responsable affecté', auteurClotureNom: 'Auteur serveur' }) }
  const closed = await closeAlert('a', 'Contact établi', 'Auteur falsifié')
  assert.equal(closed.resolution.closedBy, 'Auteur serveur')
})

test('messages identify sender by logged-in account and preserve server sent/read times', async () => {
  stored.set('ecare.session', JSON.stringify({ user: { id: 'doctor' } }))
  const dto = { id: 'server-msg', expediteurId: 'doctor', contenu: 'Message réel', envoyeLe: '2026-10-24T10:00:00Z', luLe: '2026-10-24T10:01:00Z' }
  assert.equal(mapMessage(dto, 'c', 'p').author, 'professionnel')
  assert.equal(mapMessage({ ...dto, expediteurId: 'patient-account' }, 'c', 'different-patient-id').author, 'patient')
  globalThis.fetch = async (url, init) => {
    assert.equal(url, '/api/v1/mobile/conversations/c/messages')
    assert.deepEqual(JSON.parse(init.body), { contenu: 'Message réel' })
    return json(dto)
  }
  assert.equal((await sendMessage('c', 'Message réel')).id, 'server-msg')
  globalThis.fetch = async () => json({ totalPages: 1, content: [dto] })
  assert.equal((await listMessages('c', 'p'))[0].readAt, dto.luLe)
})

test('observation authors and persisted profile values come from server', async () => {
  globalThis.fetch = async (_url, init) => {
    assert.deepEqual(JSON.parse(init.body), { contenu: 'Observation' })
    return json({ id: 'n', contenu: 'Observation', professionnelNom: 'Auteur serveur', dateCreation: '2026-10-24T10:00:00Z' })
  }
  assert.equal((await addNote('p', 'Observation', 'Faux auteur')).author, 'Auteur serveur')
  globalThis.fetch = async (_url, init) => { assert.equal(init.method, 'PATCH'); return json({ id: 'doctor', nom: 'Sauvé', prenoms: 'Profil', telephone: '+22890000000' }) }
  assert.equal((await updateProfile({ id: 'doctor', role: 'medecin', name: 'Ancien' }, { firstName: 'Profil', lastName: 'Sauvé', phone: '+22890000000' })).name, 'Profil Sauvé')
})
