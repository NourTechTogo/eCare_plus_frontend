> Document conservé des étapes précédentes. Voir [la validation de livraison](../VALIDATION.md) pour les résultats et limites à la publication. Les fichiers `.maintenance` cités ne sont pas inclus.

# Interfaces comparées aux archives d’origine

Les fichiers ci-dessous avaient changé avant la dernière restauration : 39 fichiers mobile et 49 web. Aucun fichier de vue de cet inventaire n’a disparu. Les routes agenda web et les sections simplifiées ont été rétablies ; les nouvelles données API, validations et textes légaux exacts sont conservés. Les nouveaux composants serveur, absents des archives, réutilisent désormais ces présentations.

| Partie | Fichier | Présent |
|---|---|---|
| Mobile | `lib/data/doctor_catalog.dart` | Oui |
| Mobile | `lib/main.dart` | Oui |
| Mobile | `lib/models/care_data.dart` | Oui |
| Mobile | `lib/models/user_model.dart` | Oui |
| Mobile | `lib/services/document_export_cleanup.dart` | Oui |
| Mobile | `lib/services/document_library.dart` | Oui |
| Mobile | `lib/services/document_storage_io.dart` | Oui |
| Mobile | `lib/services/document_storage_stub.dart` | Oui |
| Mobile | `lib/views/auth/code_verification_page.dart` | Oui |
| Mobile | `lib/views/auth/forgot_password_page.dart` | Oui |
| Mobile | `lib/views/auth/login_page.dart` | Oui |
| Mobile | `lib/views/auth/phone_verification_page.dart` | Oui |
| Mobile | `lib/views/auth/register_page.dart` | Oui |
| Mobile | `lib/views/dashbord/appointments_page.dart` | Oui |
| Mobile | `lib/views/dashbord/articles_page.dart` | Oui |
| Mobile | `lib/views/dashbord/doctors_page.dart` | Oui |
| Mobile | `lib/views/dashbord/documents_page.dart` | Oui |
| Mobile | `lib/views/dashbord/home_page.dart` | Oui |
| Mobile | `lib/views/dashbord/settings_page.dart` | Oui |
| Mobile | `lib/views/dashbord/treatments_page.dart` | Oui |
| Mobile | `lib/views/legal/legal_page.dart` | Oui |
| Mobile | `lib/views/legal/privacy_policy_page.dart` | Oui |
| Mobile | `lib/views/legal/terms_of_use_page.dart` | Oui |
| Mobile | `lib/views/measurement/follow_up_page.dart` | Oui |
| Mobile | `lib/views/measurement/glucose_page.dart` | Oui |
| Mobile | `lib/views/messaging/doctor_call_page.dart` | Oui |
| Mobile | `lib/views/messaging/doctor_video_preview.dart` | Oui |
| Mobile | `lib/views/notification/notifications_page.dart` | Oui |
| Mobile | `lib/views/onbording/splash_screen.dart` | Oui |
| Mobile | `lib/views/profile/profile_page.dart` | Oui |
| Mobile | `lib/views/settings/ecare_page.dart` | Oui |
| Mobile | `lib/views/settings/local_data_page.dart` | Oui |
| Mobile | `lib/widgets/appointment_availability_form.dart` | Oui |
| Mobile | `lib/widgets/auth_field.dart` | Oui |
| Mobile | `lib/widgets/document_import_sheet.dart` | Oui |
| Mobile | `lib/widgets/legal_consent.dart` | Oui |
| Mobile | `lib/widgets/main_shell.dart` | Oui |
| Mobile | `lib/widgets/social_auth_row.dart` | Oui |
| Mobile | `lib/widgets/underline_text_field.dart` | Oui |
| Web | `src/app/App.tsx` | Oui |
| Web | `src/app/routes/DoctorNotifications.tsx` | Oui |
| Web | `src/app/routes/ProtectedLayout.tsx` | Oui |
| Web | `src/app/routes/doctorRoutes.tsx` | Oui |
| Web | `src/app/routes/router.tsx` | Oui |
| Web | `src/features/alerts/components/PriorityBadge.tsx` | Oui |
| Web | `src/features/alerts/hooks/useAlerts.ts` | Oui |
| Web | `src/features/alerts/pages/AlertDetailsPage.tsx` | Oui |
| Web | `src/features/alerts/pages/AlertsPage.tsx` | Oui |
| Web | `src/features/alerts/services/alertService.ts` | Oui |
| Web | `src/features/alerts/types/alert.ts` | Oui |
| Web | `src/features/appointments/services/appointmentService.ts` | Oui |
| Web | `src/features/auth/components/AuthProvider.tsx` | Oui |
| Web | `src/features/auth/pages/LoginPage.tsx` | Oui |
| Web | `src/features/auth/passwordRules.ts` | Oui |
| Web | `src/features/auth/services/authService.ts` | Oui |
| Web | `src/features/dashboard/pages/DashboardPage.tsx` | Oui |
| Web | `src/features/landing/components/LandingPreviews.tsx` | Oui |
| Web | `src/features/landing/pages/LandingPage.tsx` | Oui |
| Web | `src/features/measurements/components/MeasurementTrends.tsx` | Oui |
| Web | `src/features/measurements/components/PatientMeasurements.tsx` | Oui |
| Web | `src/features/measurements/hooks/useLatestMeasurements.ts` | Oui |
| Web | `src/features/measurements/hooks/useMeasurements.ts` | Oui |
| Web | `src/features/measurements/labels.ts` | Oui |
| Web | `src/features/measurements/services/measurementService.ts` | Oui |
| Web | `src/features/measurements/types/measurement.ts` | Oui |
| Web | `src/features/messaging/components/ConversationThread.tsx` | Oui |
| Web | `src/features/messaging/hooks/useConversations.ts` | Oui |
| Web | `src/features/messaging/pages/MessagingPage.tsx` | Oui |
| Web | `src/features/messaging/services/callService.ts` | Oui |
| Web | `src/features/messaging/services/messagingService.ts` | Oui |
| Web | `src/features/messaging/types/message.ts` | Oui |
| Web | `src/features/notes/components/PatientNotes.tsx` | Oui |
| Web | `src/features/notes/services/noteService.ts` | Oui |
| Web | `src/features/patients/components/ConditionBadges.tsx` | Oui |
| Web | `src/features/patients/components/PatientForm.tsx` | Oui |
| Web | `src/features/patients/hooks/usePatientForm.ts` | Oui |
| Web | `src/features/patients/labels.ts` | Oui |
| Web | `src/features/patients/pages/CreatePatientPage.tsx` | Oui |
| Web | `src/features/patients/pages/EditPatientPage.tsx` | Oui |
| Web | `src/features/patients/pages/PatientDetailsPage.tsx` | Oui |
| Web | `src/features/patients/services/patientService.ts` | Oui |
| Web | `src/features/patients/types/patient.ts` | Oui |
| Web | `src/features/profile/components/PasswordChangeCard.tsx` | Oui |
| Web | `src/features/profile/components/PersonalInfoForm.tsx` | Oui |
| Web | `src/features/profile/pages/ProfilePage.tsx` | Oui |
| Web | `src/features/profile/services/profileService.ts` | Oui |
| Web | `src/hooks/useAsyncData.ts` | Oui |
| Web | `src/lib/apiClient.ts` | Oui |

Les modifications de structure de DTO/services ne sont pas annulées : les vues sont raccordées au backend réel. Voir [bilan](BILAN.md) pour les fonctions locales ou encore désactivées.
