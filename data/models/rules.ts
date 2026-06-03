/**
 * Action-level permission keys returned by `GET /me/rules`.
 *
 * The backend returns a flat array of strings — every string in the array
 * grants the user the matching action. Anything NOT in the array (or unknown)
 * is treated as disabled.
 *
 * `ALL_RULE_ACTIONS` below is the canonical list the mobile app gates on; it
 * is the contract handed to the backend so they know which keys to support.
 */
export type RuleAction =
  // ── Dashboard / shell ─────────────────────────────────────────────
  | 'view_dashboard'
  | 'view_notifications'
  // ── Profile / account ─────────────────────────────────────────────
  | 'view_profile'
  | 'edit_profile'
  | 'change_avatar'
  | 'change_password'
  | 'delete_account'
  | 'logout'
  // ── App settings ──────────────────────────────────────────────────
  | 'toggle_biometric'
  | 'toggle_push_notifications'
  | 'toggle_email_notifications'
  | 'change_language'
  | 'change_theme'
  // ── Patients ──────────────────────────────────────────────────────
  | 'view_patients'
  | 'view_patient_detail'
  | 'view_patient_care_team'
  | 'call_patient'
  | 'navigate_to_patient_address'
  // ── Lab results ───────────────────────────────────────────────────
  | 'view_lab_results'
  | 'view_lab_order_pdf'
  | 'view_lab_result_pdf'
  // ── Schedule / appointments ───────────────────────────────────────
  | 'view_schedule'
  | 'view_appointment_detail'
  | 'confirm_appointment'
  | 'confirm_for_others'
  | 'cancel_appointment'
  | 'check_in_patient'
  // ── Visits (read) ─────────────────────────────────────────────────
  | 'view_visits'
  | 'view_visit_detail'
  | 'start_visit'
  | 'end_visit'
  // ── Visit submissions (write) ─────────────────────────────────────
  | 'submit_flow_sheet_outside_dialysis'
  | 'submit_flow_sheet_pre_treatment_vitals'
  | 'submit_flow_sheet_machines'
  | 'submit_flow_sheet_pain_assessment'
  | 'submit_flow_sheet_fall_risk'
  | 'submit_flow_sheet_nursing_actions'
  | 'submit_flow_sheet_dialysis_parameters'
  | 'submit_flow_sheet_alarms_test'
  | 'submit_flow_sheet_intake_output'
  | 'submit_flow_sheet_car'
  | 'submit_flow_sheet_access'
  | 'submit_flow_sheet_dialysate'
  | 'submit_flow_sheet_anticoagulation'
  | 'submit_flow_sheet_medications'
  | 'submit_flow_sheet_post_treatment'
  | 'submit_nursing_progress_note'
  | 'submit_doctor_progress_note'
  | 'submit_social_worker_progress_note'
  | 'submit_referral'
  | 'submit_refusal'
  | 'submit_sari_screening'
  | 'submit_inventory_usage'
  // ── Help & support ────────────────────────────────────────────────
  | 'view_help_support'
  | 'submit_support_message'

export const ALL_RULE_ACTIONS: RuleAction[] = [
  'view_dashboard',
  'view_notifications',

  'view_profile',
  'edit_profile',
  'change_avatar',
  'change_password',
  'delete_account',
  'logout',

  'toggle_biometric',
  'toggle_push_notifications',
  'toggle_email_notifications',
  'change_language',
  'change_theme',

  'view_patients',
  'view_patient_detail',
  'view_patient_care_team',
  'call_patient',
  'navigate_to_patient_address',

  'view_lab_results',
  'view_lab_order_pdf',
  'view_lab_result_pdf',

  'view_schedule',
  'view_appointment_detail',
  'confirm_appointment',
  'confirm_for_others',
  'cancel_appointment',
  'check_in_patient',

  'view_visits',
  'view_visit_detail',
  'start_visit',
  'end_visit',

  'submit_flow_sheet_outside_dialysis',
  'submit_flow_sheet_pre_treatment_vitals',
  'submit_flow_sheet_machines',
  'submit_flow_sheet_pain_assessment',
  'submit_flow_sheet_fall_risk',
  'submit_flow_sheet_nursing_actions',
  'submit_flow_sheet_dialysis_parameters',
  'submit_flow_sheet_alarms_test',
  'submit_flow_sheet_intake_output',
  'submit_flow_sheet_car',
  'submit_flow_sheet_access',
  'submit_flow_sheet_dialysate',
  'submit_flow_sheet_anticoagulation',
  'submit_flow_sheet_medications',
  'submit_flow_sheet_post_treatment',
  'submit_nursing_progress_note',
  'submit_doctor_progress_note',
  'submit_social_worker_progress_note',
  'submit_referral',
  'submit_refusal',
  'submit_sari_screening',
  'submit_inventory_usage',

  'view_help_support',
  'submit_support_message',
]

/**
 * Canonical list of backend rule keys returned by `GET /me/rules`, organised
 * into namespaces so callsites read naturally — e.g.
 * `BackendRule.Appointment.ConfirmForOthers` instead of one giant flat enum.
 *
 * The top-level `Module` group holds the bare module keys (e.g. `'patients'`,
 * `'dashboard'`) that the backend also returns. The wire response is still
 * parsed as `string[]` so unknown keys do not break the response parse.
 */
export const BackendRule = {
  // Bare top-level module keys
  Module: {
    Dashboard:           'dashboard',
    Patients:            'patients',
    Appointments:        'appointments',
    Visits:              'visits',
    Employees:           'employees',
    Reports:             'reports',
    Settings:            'settings',
    Organization:        'organization',
    Inventory:           'inventory',
    Logistics:           'logistics',
    Ticketing:           'ticketing',
    WaterTreatment:      'water-treatment',
    Forms:               'forms',
    WaitingRoom:         'waiting-room',
    AuthorisedUsers:     'authorised-users',
    CustomNotifications: 'custom-notifications',
  },

  Patient: {
    Dashboard:                       'patients.dashboard',
    Demographics:                    'patients.demographics',
    DemographicsEdit:                'patients.demographics.edit',
    DemographicsCreate:              'patients.demographics.create',
    DemographicsLog:                 'patients.demographics.log',
    DemographicsExport:              'patients.demographics.export',
    Addresses:                       'patients.addresses',
    AddressesEdit:                   'patients.addresses.edit',
    AddressesCreate:                 'patients.addresses.create',
    Insurance:                       'patients.insurance',
    InsuranceEdit:                   'patients.insurance.edit',
    Eligibility:                     'patients.eligibility',
    Authorizations:                  'patients.authorizations',
    Claims:                          'patients.claims',
    Payments:                        'patients.payments',
    Allergies:                       'patients.allergies',
    AllergiesEdit:                   'patients.allergies.edit',
    Vaccines:                        'patients.vaccines',
    VaccinesEdit:                    'patients.vaccines.edit',
    Notes:                           'patients.notes',
    NotesEdit:                       'patients.notes.edit',
    DialysisOrder:                   'patients.dialysis-order',
    DialysisOrderEdit:               'patients.dialysis-order.edit',
    DialysisOrderDelete:             'patients.dialysis-order.delete',
    MainFlowsheet:                   'patients.main-flowsheet',
    Flowsheet:                       'patients.flowsheet',
    FlowsheetEdit:                   'patients.flowsheet.edit',
    Incidents:                       'patients.incidents',
    IncidentsEdit:                   'patients.incidents.edit',
    Medications:                     'patients.medications',
    MedicationsEdit:                 'patients.medications.edit',
    MedicationAdministration:        'patients.medication-administration',
    MedicationRefill:                'patients.medication-refill',
    MedicationRefillHistory:         'patients.medication-refill-history',
    LabOrders:                       'patients.lab-orders',
    LabOrdersEdit:                   'patients.lab-orders.edit',
    LabResults:                      'patients.lab-results',
    LabAnalysis:                     'patients.lab-analysis',
    VisitHistory:                    'patients.visit-history',
    Documents:                       'patients.documents',
    DocumentsEdit:                   'patients.documents.edit',
    PatientInventory:                'patients.patient-inventory',
    PatientInventoryEdit:            'patients.patient-inventory.edit',
    Alerts:                          'patients.alerts',
    NurseAcknowledgment:             'patients.nurse-acknowledgment',
    SocialWorkerAcknowledgment:      'patients.social-worker-acknowledgment',
    DietitianAcknowledgment:         'patients.dietitian-acknowledgment',
    ProgressNotes:                   'patients.progress-notes',
    ProgressNotesEdit:               'patients.progress-notes.edit',
    ProgressNotesPrint:              'patients.progress-notes.print',
    ProgressNotesApprove:            'patients.progress-notes.approve',
    MedicalReport:                   'patients.medical-report',
    MedicalReportEdit:               'patients.medical-report.edit',
    Referrals:                       'patients.referrals',
    ReferralsEdit:                   'patients.referrals.edit',
    MedicalHistory:                  'patients.medical-history',
    MedicalHistoryEdit:              'patients.medical-history.edit',
    HospitalAdmissionHistory:        'patients.hospital-admission-history',
    HospitalAdmissionHistoryEdit:    'patients.hospital-admission-history.edit',
    SocialAssessment:                'patients.social-assessment',
    SocialAssessmentEdit:            'patients.social-assessment.edit',
    NewSocialAssessment:             'patients.new-social-assessment',
    NewSocialAssessmentEdit:         'patients.new-social-assessment.edit',
    CaseStudy:                       'patients.case-study',
    CaseStudyEdit:                   'patients.case-study.edit',
    SocialHomeVisits:                'patients.social-home-visits',
    SocialHomeVisitsEdit:            'patients.social-home-visits.edit',
    SocialWorkerProgressNote:        'patients.social-worker-progress-note',
    SocialWorkerProgressNoteEdit:    'patients.social-worker-progress-note.edit',
    BloodSugar:                      'patients.blood-sugar',
    BloodSugarEdit:                  'patients.blood-sugar.edit',
    PatientResponsibility:           'patients.patient-responsibility',
    PatientResponsibilityEdit:       'patients.patient-responsibility.edit',
    PatientSignature:                'patients.patient-signature',
    PatientSignatureEdit:            'patients.patient-signature.edit',
    MedicationRecord:                'patients.medication-record',
    MedicationRecordEdit:            'patients.medication-record.edit',
    MedicationProfile:               'patients.medication-profile',
    MedicationProfileEdit:           'patients.medication-profile.edit',
    PatientAssessment:               'patients.patient-assessment',
    PatientAssessmentEdit:           'patients.patient-assessment.edit',
    ConsentForHemodialysis:          'patients.consent-for-hemodialysis',
    ConsentForHemodialysisEdit:      'patients.consent-for-hemodialysis.edit',
    MonthlyReview:                   'patients.monthly-review',
    MonthlyReviewEdit:               'patients.monthly-review.edit',
    PhysicanOrder:                   'patients.physican-order',
    PhysicanOrderEdit:               'patients.physican-order.edit',
    StandingOrder:                   'patients.standing-order',
    StandingOrderEdit:               'patients.standing-order.edit',
    DisOfHemodialysis:               'patients.dis-of-hemodialysis',
    DisOfHemodialysisEdit:           'patients.dis-of-hemodialysis.edit',
    MultidisciplinaryPlan:           'patients.multidisciplinary-plan',
    MultidisciplinaryPlanEdit:       'patients.multidisciplinary-plan.edit',
    EnrollmentsChecklist:            'patients.enrollments-checklist',
    EnrollmentsChecklistEdit:        'patients.enrollments-checklist.edit',
    EmergencyReferral:               'patients.emergency-referral',
    EmergencyReferralEdit:           'patients.emergency-referral.edit',
    ConsentForm:                     'patients.consent-form',
    ConsentFormEdit:                 'patients.consent-form.edit',
    HolidayPP:                       'patients.holiday-pp',
    HolidayPPEdit:                   'patients.holiday-pp.edit',
    HolidayTreatment:                'patients.holiday-treatment',
    HolidayTreatmentEdit:            'patients.holiday-treatment.edit',
    ScopeOfService:                  'patients.scope-of-service',
    ScopeOfServiceEdit:              'patients.scope-of-service.edit',
    AcceptanceProcess:               'patients.acceptance-process',
    AcceptanceProcessEdit:           'patients.acceptance-process.edit',
    DsposableConsumption:            'patients.dsposable-consumption',
    DsposableConsumptionEdit:        'patients.dsposable-consumption.edit',
    ConsumptionReport:               'patients.consumption-report',
    ConsumptionReportEdit:           'patients.consumption-report.edit',
    VisualTriageChecklist:           'patients.visual-triage-checklist',
    VisualTriageChecklistEdit:       'patients.visual-triage-checklist.edit',
    NeedleInsertionTool:             'patients.needle-insertion-tool',
    NeedleInsertionToolEdit:         'patients.needle-insertion-tool.edit',
    HemodialysisBundle:              'patients.hemodialysis-bundle',
    HemodialysisBundleEdit:          'patients.hemodialysis-bundle.edit',
    CompetencyAssessment:            'patients.competency-assessment',
    CompetencyAssessmentEdit:        'patients.competency-assessment.edit',
    RespiratoryIllnessScreening:     'patients.respiratory-illness-screening',
    RespiratoryIllnessScreeningEdit: 'patients.respiratory-illness-screening.edit',
    RespiratoryTriage:               'patients.respiratory-triage',
    EvaluationReport:                'patients.evaluation-report',
    EvaluationReportEdit:            'patients.evaluation-report.edit',
    InfectionMonitoring:             'patients.infection-monitoring',
    InfectionMonitoringEdit:         'patients.infection-monitoring.edit',
    DialysisEventSurveillance:       'patients.dialysis-event-surveillance',
    DialysisEventSurveillanceEdit:   'patients.dialysis-event-surveillance.edit',
    NutritionAssessment:             'patients.nutrition-assessment',
    NutritionAssessmentEdit:         'patients.nutrition-assessment.edit',
    NutritionReassessment:           'patients.nutrition-reassessment',
    NutritionReassessmentEdit:       'patients.nutrition-reassessment.edit',
    NutritionProgressNotes:          'patients.nutrition-progress-notes',
    NutritionProgressNotesEdit:      'patients.nutrition-progress-notes.edit',
    NutritionProgressNotesApprove:   'patients.nutrition-progress-notes.approve',
    NutritionProgressNotesPrint:     'patients.nutrition-progress-notes.print',
    MobileAppAccess:                 'patients.mobile-app-access',
    DoctorNote:                      'patients.doctor-note',
    NurseNote:                       'patients.nurse-note',
    PhysicalExamDialysis:            'patients.physical-exam-dialysis',
    PhysicalExamDialysisEdit:        'patients.physical-exam-dialysis.edit',
    ChiefComplaint:                  'patients.chief-complaint',
    ChiefComplaintEdit:              'patients.chief-complaint.edit',
    EdmaCheck:                       'patients.edma-check',
    EdmaCheckEdit:                   'patients.edma-check.edit',
    InvestigationLogSheet:           'patients.investigation-log-sheet',
    InvestigationLogSheetEdit:       'patients.investigation-log-sheet.edit',
    MorseFallsRiskAssessment:        'patients.morse-falls-risk-assessment',
    MorseFallsRiskAssessmentEdit:    'patients.morse-falls-risk-assessment.edit',
    VascularAccessAssessment:        'patients.vascular-access-assessment',
    VascularAccessAssessmentEdit:    'patients.vascular-access-assessment.edit',
    IcdView:                         'patients.icd.view',
    IcdEdit:                         'patients.icd.edit',
    MyPatients:                      'patients.my-patients',
    PatientForm:                     'patients.patient-form',
    PatientFormEdit:                 'patients.patient-form.edit',
    DailyMonitoring:                 'patients.daily-monitoring',
    DailyMonitoringEdit:             'patients.daily-monitoring.edit',
    Prescriptions:                   'patients.prescriptions',
    PrescriptionsEdit:               'patients.prescriptions.edit',
    OverAllFeedback:                 'patients.over-all-feedback',
    OverAllFeedbackEdit:             'patients.over-all-feedback.edit',
    NursingProgressNote:             'patients.nursing-progress-note',
    NursingProgressNoteEdit:         'patients.nursing-progress-note.edit',
    PatientMachine:                  'patients.patient-machine',
    PatientMachineEdit:              'patients.patient-machine.edit',
  },

  Appointment: {
    ViewMy:           'appointments.viewMyAppointments',
    EditMy:           'appointments.editMyAppointments',
    ViewAll:          'appointments.viewAllAppointments',
    EditAll:          'appointments.editAllAppointments',
    ConfirmForOthers: 'appointments.confirmForOthers',
    Create:           'appointments.createAppointment',
    ViewMyPatients:   'appointments.viewMyPatientsAppointments',
  },

  Visit: {
    ViewAll:                            'visits.ViewAllVisits',
    ViewEditMy:                         'visits.viewEditMyVisits',
    EditAll:                            'visits.EditAllVisits',
    EditMy:                             'visits.EditMyVisits',
    StartMy:                            'visits.StartMyVisit',
    EndMy:                              'visits.EndMyVisit',
    StartAll:                           'visits.StartAllVisits',
    EndAll:                             'visits.EndAllVisits',
    StartEndMyProcedure:                'visits.StartEndMyProcedure',
    StartEndAllProcedure:               'visits.StartEndAllProcedure',
    ReopenMy:                           'visits.ReopenMyVisit',
    ReopenAll:                          'visits.ReopenAllVisit',
    ViewEditNurseAcknowledgment:        'visits.viewEditNurseAcknowledgment',
    ViewEditSocialWorkerAcknowledgment: 'visits.viewEditSocialWorkerAcknowledgment',
    ViewEditDietitianAcknowledgment:    'visits.viewEditDietitianAcknowledgment',
    Export:                             'visits.export',
    DoctorTimeTracking:                 'visits.doctorTimeTracking',
  },

  Employee: {
    View:             'employees.view',
    Create:           'employees.create',
    Edit:             'employees.edit',
    RolesLoginInfo:   'employees.rolesLoginInfo',
    EditRoles:        'employees.editRoles',
    WorkingHours:     'employees.workingHours',
    EditWorkingHours: 'employees.editWorkingHours',
    Vacations:        'employees.vacations',
    EditVacations:    'employees.editVacations',
    ViewMyAccount:    'employees.viewMyAccount',

    ScopeOfWork: {
      HolidayPP:             'employees.scope-of-work.holiday-pp',
      AcceptanceProcess:     'employees.scope-of-work.acceptance-process',
      CatheterInfectionRate: 'employees.scope-of-work.catheter-infection-rate',
      LabSchedule:           'employees.scope-of-work.lab-schedule',
    },

    ScopeOfService:                        'employees.scope-of-service',
    ScopeOfServiceEdit:                    'employees.scope-of-service.edit',
    AdultPhysicalCompetency:               'employees.adult-physical-competency',
    AdultPhysicalCompetencyEdit:           'employees.adult-physical-competency.edit',
    ProcedureMachineCompetency:            'employees.procedure-machine-competency',
    ProcedureMachineCompetencyEdit:        'employees.procedure-machine-competency.edit',
    AsepticTechniqueCompetency:            'employees.aseptic-technique-competency',
    AsepticTechniqueCompetencyEdit:        'employees.aseptic-technique-competency.edit',
    MedicationAdministrationAndSafety:     'employees.medication-administration-and-safety',
    MedicationAdministrationAndSafetyEdit: 'employees.medication-administration-and-safety.edit',
    OxygenTherapyCompetency:               'employees.oxygen-therapy-competency',
    OxygenTherapyCompetencyEdit:           'employees.oxygen-therapy-competency.edit',
    PainAssessmentAndManagement:           'employees.pain-assessment-and-management',
    PainAssessmentAndManagementEdit:       'employees.pain-assessment-and-management.edit',
    VascularAccessAfvAvg:                  'employees.vascular-access-afv-avg',
    VascularAccessAfvAvgEdit:              'employees.vascular-access-afv-avg.edit',
    CompetencyBasedOrientation:            'employees.competency-based-orientation',
    CompetencyBasedOrientationEdit:        'employees.competency-based-orientation.edit',
    VasularAccessDlc:                      'employees.vasular-access-dlc',
    VasularAccessDlcEdit:                  'employees.vasular-access-dlc.edit',
    CompetencyBasedOrientationSummary:     'employees.competency-based-orientation-summary',
    CompetencyBasedOrientationSummaryEdit: 'employees.competency-based-orientation-summary.edit',
  },

  Report: {
    View:        'reports.view',
    Kpis:        'reports.kpis',
    DailyReport: 'reports.daily-report',
  },

  Logistic: {
    View:               'logistics.view',
    ManageAppointments: 'logistics.manage_appointments',
    ManageDrivers:      'logistics.manage_drivers',
    ViewMap:            'logistics.view_map',
  },

  Setting: {
    View:                          'settings.view',
    ViewEditVaccinesCompanies:     'settings.viewEditVaccinesCompanies',
    ViewEditVaccines:              'settings.viewEditVaccines',
    ViewEditRolesPrivileges:       'settings.viewEditRolesPrivileges',
    ViewEditNationalities:         'settings.viewEditNationalities',
    ViewEditDialysisPrescriptions: 'settings.viewEditDialysisPrescriptions',
    ViewEditSubscriptions:         'settings.viewEditSubscriptions',
    ViewEditHospitals:             'settings.viewEditHospitals',
    ViewEditAreas:                 'settings.viewEditAreas',
    ViewEditMachines:              'settings.viewEditMachines',
    ViewEditInsuranceCompanies:    'settings.viewEditInsuranceCompanies',
    ViewEditReligions:             'settings.viewEditReligions',
    ViewEditLabTests:              'settings.viewEditLabTests',
    ViewEditLabCompanies:          'settings.viewEditLabCompanies',
    ViewEditLabPanels:             'settings.viewEditLabPanels',
    ViewEditPatientMobileApp:      'settings.viewEditPatientMobileApp',
    ViewEditIcdCpt:                'settings.viewEditICDCPT',
    ViewEditTicketingSystem:       'settings.viewEditTicketingSystem',
    ViewEditVisitTypes:            'settings.viewEditVisitTypes',
    ViewEditGeneralSettings:       'settings.viewEditGeneralSettings',
    ViewEditSapProjects:           'settings.viewEditSapProjects',
  },

  Branch: {
    ViewEdit: 'branches.viewEditBranches',
  },

  InventoryAction: {
    ViewUsage:         'inventory.viewUsage',
    CreateUsage:       'inventory.createUsage',
    EditUsage:         'inventory.editUsage',
    DeleteUsage:       'inventory.deleteUsage',
    AllocateToPatient: 'inventory.allocate-to-patient',
    UseItem:           'inventory.use-item',
    ViewSapOrder:      'inventory.view-sap-order',
    AllocateToBranch:  'inventory.allocate-to-branch',
  },

  TicketingAction: {
    ViewTickets:      'ticketing.viewTickets',
    CreateTickets:    'ticketing.createTickets',
    EditTickets:      'ticketing.editTickets',
    DeleteTickets:    'ticketing.deleteTickets',
    ViewCategories:   'ticketing.viewCategories',
    CreateCategories: 'ticketing.createCategories',
    EditCategories:   'ticketing.editCategories',
    DeleteCategories: 'ticketing.deleteCategories',
  },

  Water: {
    View:             'water-treatment.view',
    Create:           'water-treatment.create',
    Edit:             'water-treatment.edit',
    Delete:           'water-treatment.delete',
    NephrologistSign: 'water-treatment.nephrologist-sign',
    NurseSign:        'water-treatment.nurse-sign',
  },

  DashboardWidget: {
    View:           'dashboard.view',
    Chat:           'dashboard.chat',
    VisitsChart:    'dashboard.visits-chart',
    PatientsChart:  'dashboard.patients-chart',
    IncidentsChart: 'dashboard.incidents-chart',
    ActiveSessions: 'dashboard.active-sessions',
  },

  FollowUp: {
    View:   'follow_up.view',
    Create: 'follow_up.create',
    Edit:   'follow_up.edit',
    Action: 'follow_up.action',
    Delete: 'follow_up.delete',
  },

  AuthorisedUser: {
    View:   'authorised-users.view',
    Create: 'authorised-users.create',
    Edit:   'authorised-users.edit',
    Delete: 'authorised-users.delete',
  },

  CustomNotification: {
    View:   'custom-notifications.view',
    Create: 'custom-notifications.create',
    Edit:   'custom-notifications.edit',
    Delete: 'custom-notifications.delete',
  },

  Org: {
    View:   'organization.view',
    Create: 'organization.create',
    Edit:   'organization.edit',
  },

  Dermatology: {
    View: 'dermatology.view',
    Edit: 'dermatology.edit',
  },

  WaitingRoomAction: {
    ViewAllAppointmentsProviders: 'waiting-room.viewAllAppointmentsProviders',
    ViewMyAppointmentsProviders:  'waiting-room.viewMyAppointmentsProviders',
    CheckIn:                      'waiting-room.checkIn',
    CheckOut:                     'waiting-room.checkOut',
    DoctorCheckInOut:             'waiting-room.doctorCheckInOut',
    ViewMedicalHistory:           'waiting-room.viewMedicalHistory',
    ViewAppointmentDetails:       'waiting-room.viewAppointmentDetails',
    ViewVisitDetails:             'waiting-room.viewVisitDetails',
  },
} as const

type Leaves<T> = T extends string
  ? T
  : T extends object
    ? { [K in keyof T]: Leaves<T[K]> }[keyof T]
    : never

/** Union of every backend rule string value declared in `BackendRule`. */
export type BackendRuleKey = Leaves<typeof BackendRule>

function flattenRules(obj: object, out: string[] = []): string[] {
  for (const v of Object.values(obj)) {
    if (typeof v === 'string') out.push(v)
    else if (v && typeof v === 'object') flattenRules(v, out)
  }
  return out
}

/** Flat list of every backend rule string (deduped, derived from `BackendRule`). */
export const ALL_BACKEND_RULES: readonly BackendRuleKey[] =
  Array.from(new Set(flattenRules(BackendRule))) as BackendRuleKey[]

/** Backend response shape — wire format is loose `string[]` so unknown keys
 *  from the server don't fail the response parse. Compare against
 *  `BackendRuleKey` when narrowing. */
export interface RulesResponse {
  rules: string[]
}

/**
 * Maps each semantic FE rule key onto the backend rule string(s) needed to
 * grant it. Multiple backend keys mean "any of them is enough" (logical OR).
 *
 * Actions that are pure UI affordances (theme, language, biometrics, logout,
 * etc.) are NOT in this map; `can()` treats unmapped actions as **allowed**
 * so adding a new FE rule never silently locks users out before the backend
 * adds a matching key.
 */
export const FE_RULE_TO_BACKEND: Partial<Record<RuleAction, BackendRuleKey | BackendRuleKey[]>> = {
  // ── Dashboard / shell ─────────────────────────────────────────────
  view_dashboard:      [BackendRule.DashboardWidget.View, BackendRule.Module.Dashboard],
  view_notifications:  [BackendRule.CustomNotification.View, BackendRule.Module.CustomNotifications],

  // ── Profile / account ─────────────────────────────────────────────
  view_profile:        BackendRule.Employee.ViewMyAccount,

  // ── Patients ──────────────────────────────────────────────────────
  view_patients:                BackendRule.Module.Patients,
  view_patient_detail:          [BackendRule.Patient.Dashboard, BackendRule.Module.Patients],
  view_patient_care_team:       BackendRule.Patient.Dashboard,

  // ── Lab results ───────────────────────────────────────────────────
  view_lab_results:     BackendRule.Patient.LabResults,
  view_lab_order_pdf:   BackendRule.Patient.LabOrders,
  view_lab_result_pdf:  BackendRule.Patient.LabResults,

  // ── Schedule / appointments ───────────────────────────────────────
  view_schedule:           [BackendRule.Appointment.ViewMy, BackendRule.Appointment.ViewAll, BackendRule.Module.Appointments],
  view_appointment_detail: [BackendRule.WaitingRoomAction.ViewAppointmentDetails, BackendRule.Appointment.ViewMy, BackendRule.Appointment.ViewAll],
  confirm_appointment:     [BackendRule.Appointment.EditMy, BackendRule.Appointment.EditAll],
  confirm_for_others:      BackendRule.Appointment.ConfirmForOthers,
  cancel_appointment:      [BackendRule.Appointment.EditMy, BackendRule.Appointment.EditAll],
  check_in_patient:        BackendRule.WaitingRoomAction.CheckIn,

  // ── Visits ────────────────────────────────────────────────────────
  view_visits:        [BackendRule.Visit.ViewEditMy, BackendRule.Visit.ViewAll, BackendRule.Module.Visits],
  view_visit_detail:  [BackendRule.WaitingRoomAction.ViewVisitDetails, BackendRule.Visit.ViewEditMy, BackendRule.Visit.ViewAll],
  start_visit:        [BackendRule.Visit.StartMy, BackendRule.Visit.StartAll],
  end_visit:          [BackendRule.Visit.EndMy, BackendRule.Visit.EndAll],

  // ── Flow sheet submissions — all gated by the patient flowsheet edit rule ──
  submit_flow_sheet_outside_dialysis:    BackendRule.Patient.FlowsheetEdit,
  submit_flow_sheet_pre_treatment_vitals:BackendRule.Patient.FlowsheetEdit,
  submit_flow_sheet_machines:            BackendRule.Patient.FlowsheetEdit,
  submit_flow_sheet_pain_assessment:     BackendRule.Patient.FlowsheetEdit,
  submit_flow_sheet_fall_risk:           [BackendRule.Patient.FlowsheetEdit, BackendRule.Patient.MorseFallsRiskAssessmentEdit],
  submit_flow_sheet_nursing_actions:     BackendRule.Patient.FlowsheetEdit,
  submit_flow_sheet_dialysis_parameters: BackendRule.Patient.FlowsheetEdit,
  submit_flow_sheet_alarms_test:         BackendRule.Patient.FlowsheetEdit,
  submit_flow_sheet_intake_output:       BackendRule.Patient.FlowsheetEdit,
  submit_flow_sheet_car:                 BackendRule.Patient.FlowsheetEdit,
  submit_flow_sheet_access:              [BackendRule.Patient.FlowsheetEdit, BackendRule.Patient.VascularAccessAssessmentEdit],
  submit_flow_sheet_dialysate:           BackendRule.Patient.FlowsheetEdit,
  submit_flow_sheet_anticoagulation:     BackendRule.Patient.FlowsheetEdit,
  submit_flow_sheet_medications:         [BackendRule.Patient.FlowsheetEdit, BackendRule.Patient.MedicationsEdit],
  submit_flow_sheet_post_treatment:      BackendRule.Patient.FlowsheetEdit,

  // ── Progress notes / referrals / screenings ───────────────────────
  // Each note accepts EITHER its dedicated visit note rule (the ones the
  // backend actually grants per role — `patients.doctor-note`,
  // `patients.nurse-note`, `patients.social-worker-progress-note`) OR the
  // generic `*-progress-note(.edit)` rule, so a user granted only one is not
  // wrongly locked out.
  submit_nursing_progress_note:       [BackendRule.Patient.NursingProgressNoteEdit, BackendRule.Patient.NurseNote],
  submit_doctor_progress_note:        [BackendRule.Patient.ProgressNotesEdit, BackendRule.Patient.DoctorNote],
  submit_social_worker_progress_note: [BackendRule.Patient.SocialWorkerProgressNoteEdit, BackendRule.Patient.SocialWorkerProgressNote],
  submit_referral:                    BackendRule.Patient.ReferralsEdit,
  submit_sari_screening:              BackendRule.Patient.RespiratoryIllnessScreeningEdit,
  submit_inventory_usage:             [BackendRule.InventoryAction.UseItem, BackendRule.InventoryAction.CreateUsage],

  // ── Support ───────────────────────────────────────────────────────
  submit_support_message: BackendRule.TicketingAction.CreateTickets,
}

/** Returns true when the user has any of the backend rules mapped to `action`.
 *  If the action has no mapping, returns `true` (treated as always allowed). */
export function isActionAllowed(
  action: RuleAction,
  granted: ReadonlySet<string>,
): boolean {
  const mapped = FE_RULE_TO_BACKEND[action]
  if (mapped === undefined) return true
  const keys = Array.isArray(mapped) ? mapped : [mapped]
  return keys.some(k => granted.has(k))
}
