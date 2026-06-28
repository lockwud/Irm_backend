export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "AAMUSTED SIP API",
    version: "0.1.0",
    description: "Backend API for the AAMUSTED Student Internship Programme coordinator, supervisor and student workflows.",
  },
  servers: [
    { url: "http://localhost:4000", description: "Local development server" },
  ],
  security: [{ bearerAuth: [] }],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Workflow" },
    { name: "Students" },
    { name: "Placements" },
    { name: "Lesson Notes" },
    { name: "Visits" },
    { name: "Staff Onboarding" },
    { name: "Notifications" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API health",
        security: [],
        responses: { "200": { description: "API is running" } },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login to a portal",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
              examples: {
                coordinator: { value: { role: "coordinator", identifier: "coordinator@aamusted.edu.gh", password: "Coordinator@123" } },
                supervisor: { value: { role: "supervisor", identifier: "STA-0182", password: "Supervisor@123" } },
                student: { value: { role: "student", identifier: "5221040348@st.aamusted.edu.gh", password: "5221040348" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful", content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } } },
          "401": { description: "Invalid login details" },
        },
      },
    },
    "/api/v1/auth/change-password": {
      post: {
        tags: ["Auth"],
        summary: "Change the signed-in user's password",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["currentPassword", "newPassword"], properties: { currentPassword: { type: "string" }, newPassword: { type: "string", minLength: 8 } } } } },
        },
        responses: { "200": { description: "Password changed" }, "400": { description: "Current password invalid" }, "401": { description: "Missing or invalid token" } },
      },
    },
    "/api/v1/workflow": {
      get: {
        tags: ["Workflow"],
        summary: "Get complete demo workflow state",
        responses: { "200": { description: "Workflow state", content: { "application/json": { schema: { $ref: "#/components/schemas/WorkflowData" } } } } },
      },
      put: {
        tags: ["Workflow"],
        summary: "Replace parts of the workflow state",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/WorkflowData" } } } },
        responses: { "200": { description: "Updated workflow state" } },
      },
    },
    "/api/v1/students": {
      get: { tags: ["Students"], summary: "List students", responses: { "200": { description: "Students list" } } },
      post: {
        tags: ["Students"],
        summary: "Create student",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Student" } } } },
        responses: { "201": { description: "Student created" } },
      },
    },
    "/api/v1/placements": {
      get: { tags: ["Placements"], summary: "List placement requests", responses: { "200": { description: "Placement list" } } },
      post: {
        tags: ["Placements"],
        summary: "Create placement request",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Placement" } } } },
        responses: { "201": { description: "Placement created" } },
      },
    },
    "/api/v1/placements/{id}/approve": {
      post: {
        tags: ["Placements"],
        summary: "Approve placement request",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { supervisor: { type: "string", example: "Dr. S. Ofori" } } } } } },
        responses: { "200": { description: "Placement approved" }, "404": { description: "Placement not found" } },
      },
    },
    "/api/v1/placements/{id}/reject": {
      post: {
        tags: ["Placements"],
        summary: "Reject placement request",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        responses: { "200": { description: "Placement rejected" }, "404": { description: "Placement not found" } },
      },
    },
    "/api/v1/lesson-notes": {
      get: { tags: ["Lesson Notes"], summary: "List lesson notes", responses: { "200": { description: "Lesson note list" } } },
      post: {
        tags: ["Lesson Notes"],
        summary: "Create lesson note",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LessonNote" } } } },
        responses: { "201": { description: "Lesson note created" } },
      },
    },
    "/api/v1/lesson-notes/{id}/supervisor-review": {
      post: {
        tags: ["Lesson Notes"],
        summary: "Submit supervisor lesson-note decision",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["Approved", "Revision"] } } } } } },
        responses: { "200": { description: "Lesson note reviewed" }, "404": { description: "Lesson note not found" } },
      },
    },
    "/api/v1/visits": {
      get: { tags: ["Visits"], summary: "List supervision visits", responses: { "200": { description: "Visit list" } } },
      post: {
        tags: ["Visits"],
        summary: "Schedule supervision visit window",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Visit" } } } },
        responses: { "201": { description: "Visit created" } },
      },
    },
    "/api/v1/visits/{id}/reschedule": {
      post: {
        tags: ["Visits"],
        summary: "Reschedule exact visit date within/after a visit window",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["rescheduledDate"], properties: { rescheduledDate: { type: "string", format: "date" }, time: { type: "string", example: "10:00" }, reason: { type: "string" } } } } } },
        responses: { "200": { description: "Visit rescheduled" }, "404": { description: "Visit not found" } },
      },
    },
    "/api/v1/visits/{id}/complete": {
      post: {
        tags: ["Visits"],
        summary: "Mark visit as completed",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        responses: { "200": { description: "Visit completed" }, "404": { description: "Visit not found" } },
      },
    },
    "/api/v1/staff/invitations": {
      get: { tags: ["Staff Onboarding"], summary: "List staff invitations", responses: { "200": { description: "Invitation list" } } },
      post: {
        tags: ["Staff Onboarding"],
        summary: "Invite coordinator or supervisor staff",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/StaffInvitationInput" } } } },
        responses: { "201": { description: "Staff invitation created" }, "400": { description: "Invalid invitation data" } },
      },
    },
    "/api/v1/staff/invitations/{id}/revoke": {
      post: {
        tags: ["Staff Onboarding"],
        summary: "Revoke staff invitation",
        parameters: [{ $ref: "#/components/parameters/Id" }],
        responses: { "200": { description: "Invitation revoked" }, "404": { description: "Invitation not found" } },
      },
    },
    "/api/v1/notifications": {
      get: { tags: ["Notifications"], summary: "List notifications", responses: { "200": { description: "Notification list" } } },
    },
    "/api/v1/notifications/device": {
      post: {
        tags: ["Notifications"],
        summary: "Register a browser/device token for Firebase Cloud Messaging",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token"],
                properties: {
                  token: { type: "string" },
                  platform: { type: "string", example: "web" },
                  role: { type: "string", example: "coordinator" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Device registered" }, "400": { description: "Missing device token" } },
      },
    },
    "/api/v1/notifications/read-all": {
      patch: { tags: ["Notifications"], summary: "Mark all notifications as read", responses: { "200": { description: "Notifications updated" } } },
    },
    "/api/v1/support/tickets": {
      get: { tags: ["Support"], summary: "Coordinator support queue", responses: { "200": { description: "Support ticket list" } } },
      post: { tags: ["Support"], summary: "Create support ticket from student, supervisor or coordinator", responses: { "201": { description: "Support ticket created" } } },
    },
    "/api/v1/support/tickets/{id}/replies": {
      post: { tags: ["Support"], summary: "Coordinator live-chat style reply to a ticket", parameters: [{ $ref: "#/components/parameters/Id" }], responses: { "201": { description: "Reply added" }, "404": { description: "Ticket not found" } } },
    },
    "/api/v1/support/tickets/{id}": {
      patch: { tags: ["Support"], summary: "Update support ticket status or priority", parameters: [{ $ref: "#/components/parameters/Id" }], responses: { "200": { description: "Ticket updated" }, "404": { description: "Ticket not found" } } },
    },
    "/api/v1/students/register": {
      post: { tags: ["Students"], summary: "Register/create a student account for demo onboarding", security: [], responses: { "201": { description: "Student registered" } } },
    },
    "/api/v1/staff/register": {
      post: { tags: ["Staff Onboarding"], summary: "Register/create a staff account for demo onboarding", security: [], responses: { "201": { description: "Staff registered" } } },
    },
    "/api/v1/schools": {
      get: { tags: ["Placements"], summary: "List partner schools", responses: { "200": { description: "Schools list" } } },
      post: { tags: ["Placements"], summary: "Create partner school", responses: { "201": { description: "School created" } } },
    },
    "/api/v1/schools/{id}": {
      get: { tags: ["Placements"], summary: "Get school details", parameters: [{ $ref: "#/components/parameters/Id" }], responses: { "200": { description: "School details" }, "404": { description: "School not found" } } },
      patch: { tags: ["Placements"], summary: "Update partner school", parameters: [{ $ref: "#/components/parameters/Id" }], responses: { "200": { description: "School updated" } } },
      delete: { tags: ["Placements"], summary: "Delete partner school", parameters: [{ $ref: "#/components/parameters/Id" }], responses: { "200": { description: "School deleted" } } },
    },
    "/api/v1/staff": {
      get: { tags: ["Staff Onboarding"], summary: "List staff members", responses: { "200": { description: "Staff list" } } },
    },
    "/api/v1/supervisors": {
      get: { tags: ["Staff Onboarding"], summary: "Fetch supervisors for dropdowns and assignment", responses: { "200": { description: "Supervisor list" } } },
      post: { tags: ["Staff Onboarding"], summary: "Create supervisor", responses: { "201": { description: "Supervisor created" } } },
    },
    "/api/v1/supervisor-assignments": {
      get: { tags: ["Staff Onboarding"], summary: "List supervisor assignments", responses: { "200": { description: "Supervisor assignment list" } } },
      post: { tags: ["Staff Onboarding"], summary: "Assign supervisor to regions and interns", responses: { "201": { description: "Supervisor assignment created" } } },
    },
    "/api/v1/supervisor-assignments/{id}": {
      patch: { tags: ["Staff Onboarding"], summary: "Update supervisor assignment", parameters: [{ $ref: "#/components/parameters/Id" }], responses: { "200": { description: "Supervisor assignment updated" } } },
    },
    "/api/v1/placements/{id}/assign-supervisor": {
      post: { tags: ["Placements"], summary: "Assign supervisor to placement", parameters: [{ $ref: "#/components/parameters/Id" }], responses: { "200": { description: "Supervisor assigned" } } },
    },
    "/api/v1/settings": {
      get: { tags: ["Workflow"], summary: "Get programme settings", responses: { "200": { description: "Settings" } } },
      patch: { tags: ["Workflow"], summary: "Update programme settings", responses: { "200": { description: "Settings updated" } } },
    },
    "/api/v1/configurations/irb-template": {
      get: { tags: ["Workflow"], summary: "Get coordinator IRB template configuration", responses: { "200": { description: "IRB template sections" } } },
      put: { tags: ["Workflow"], summary: "Replace coordinator IRB template configuration", responses: { "200": { description: "IRB template saved" } } },
    },
    "/api/v1/configurations/irb-template/sections": {
      post: { tags: ["Workflow"], summary: "Add configurable IRB section", responses: { "201": { description: "IRB section created" } } },
    },
    "/api/v1/configurations/irb-template/sections/{id}": {
      patch: { tags: ["Workflow"], summary: "Update IRB section", parameters: [{ $ref: "#/components/parameters/Id" }], responses: { "200": { description: "IRB section updated" } } },
      delete: { tags: ["Workflow"], summary: "Delete IRB section", parameters: [{ $ref: "#/components/parameters/Id" }], responses: { "200": { description: "IRB section deleted" } } },
    },
    "/api/v1/configurations/lesson-note-format": {
      get: { tags: ["Lesson Notes"], summary: "Get coordinator lesson-note format", responses: { "200": { description: "Lesson-note format" } } },
      put: { tags: ["Lesson Notes"], summary: "Update coordinator lesson-note format", responses: { "200": { description: "Lesson-note format saved" } } },
    },
    "/api/v1/irb/sections": {
      get: { tags: ["Workflow"], summary: "List IRB sections available to students", responses: { "200": { description: "IRB sections" } } },
    },
    "/api/v1/irb/submissions": {
      get: { tags: ["Workflow"], summary: "List IRB submissions", responses: { "200": { description: "IRB submissions" } } },
      post: { tags: ["Workflow"], summary: "Submit an IRB section", responses: { "201": { description: "IRB submission created" } } },
    },
    "/api/v1/irb/submissions/{id}": {
      get: { tags: ["Workflow"], summary: "Get IRB submission", parameters: [{ $ref: "#/components/parameters/Id" }], responses: { "200": { description: "IRB submission details" } } },
      delete: { tags: ["Workflow"], summary: "Delete IRB submission", parameters: [{ $ref: "#/components/parameters/Id" }], responses: { "200": { description: "IRB submission deleted" } } },
    },
    "/api/v1/irb/submissions/{id}/review": {
      patch: { tags: ["Workflow"], summary: "Review IRB submission", parameters: [{ $ref: "#/components/parameters/Id" }], responses: { "200": { description: "IRB submission reviewed" } } },
    },
    "/api/v1/internship-letter/template": {
      get: { tags: ["Workflow"], summary: "Get internship letter template", responses: { "200": { description: "Internship letter template" } } },
      put: { tags: ["Workflow"], summary: "Update internship letter template", responses: { "200": { description: "Internship letter template saved" } } },
    },
    "/api/v1/internship-letter/generate": {
      post: { tags: ["Workflow"], summary: "Generate student internship letter", responses: { "200": { description: "Generated letter preview" } } },
    },
    "/api/v1/internship-letter/download/{studentId}": {
      get: { tags: ["Workflow"], summary: "Download student internship letter", parameters: [{ name: "studentId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Letter download" } } },
    },
    "/api/v1/me": {
      get: { tags: ["Auth"], summary: "Get current authenticated user", responses: { "200": { description: "Current user" } } },
    },
    "/api/v1/dashboard/summary": {
      get: { tags: ["Workflow"], summary: "Get dashboard summary counts", responses: { "200": { description: "Dashboard summary" } } },
    },
    "/api/v1/dashboard/coordinator": {
      get: { tags: ["Dashboard"], summary: "Get coordinator dashboard KPIs, activity and visit summaries", responses: { "200": { description: "Coordinator dashboard KPIs" } } },
    },
    "/api/v1/dashboard/supervisor": {
      get: { tags: ["Dashboard"], summary: "Get supervisor dashboard KPIs for assigned interns, lesson reviews and visits", responses: { "200": { description: "Supervisor dashboard KPIs" } } },
    },
    "/api/v1/dashboard/student": {
      get: { tags: ["Dashboard"], summary: "Get student dashboard KPIs for placement, IRB, lesson notes and visits", responses: { "200": { description: "Student dashboard KPIs" } } },
    },
    "/api/v1/audit-logs": {
      get: { tags: ["Workflow"], summary: "List audit logs", responses: { "200": { description: "Audit logs" } } },
    },
    "/api/v1/bulk-uploads": {
      post: { tags: ["Workflow"], summary: "Create bulk upload processing record", responses: { "201": { description: "Bulk upload processed" } } },
    },
    "/api/v1/reports": {
      get: { tags: ["Workflow"], summary: "List report templates/results", responses: { "200": { description: "Reports" } } },
    },
    "/api/v1/reports/generate": {
      post: { tags: ["Workflow"], summary: "Generate report", responses: { "201": { description: "Report generated" } } },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    parameters: {
      Id: { name: "id", in: "path", required: true, schema: { type: "string" } },
    },
    schemas: {
      LoginRequest: {
        type: "object",
        required: ["role", "identifier", "password"],
        properties: {
          role: { type: "string", enum: ["student", "supervisor", "coordinator"] },
          identifier: { type: "string" },
          password: { type: "string" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: { type: "string" },
          accessToken: { type: "string" },
          tokenType: { type: "string", example: "Bearer" },
          user: { type: "object", properties: { role: { type: "string" }, identifier: { type: "string" }, name: { type: "string" } } },
        },
      },
      Student: {
        type: "object",
        required: ["id", "name", "email", "programme", "department", "year", "school", "region", "status"],
        properties: {
          id: { type: "string", example: "5201040012" },
          name: { type: "string", example: "Kwame Mensah" },
          email: { type: "string", example: "kmensah@st.aamusted.edu.gh" },
          programme: { type: "string", example: "B.Ed. Mathematics" },
          department: { type: "string", example: "Mathematics Education" },
          year: { type: "number", example: 4 },
          school: { type: "string", example: "Asokwa M/A JHS" },
          region: { type: "string", example: "Ashanti" },
          status: { type: "string", enum: ["Active", "Pending", "Completed"] },
        },
      },
      Placement: {
        type: "object",
        properties: {
          id: { type: "string", example: "PL-1045" },
          student: { type: "string" },
          school: { type: "string" },
          municipality: { type: "string" },
          community: { type: "string" },
          region: { type: "string" },
          supervisor: { type: "string" },
          requested: { type: "string" },
          status: { type: "string", enum: ["Pending", "Approved", "Rejected"] },
        },
      },
      LessonNote: {
        type: "object",
        properties: {
          id: { type: "string", example: "LN-220" },
          student: { type: "string" },
          subject: { type: "string" },
          topic: { type: "string" },
          week: { type: "string" },
          mentor: { type: "string", enum: ["Pending", "Approved", "Revision"] },
          supervisor: { type: "string", enum: ["Pending", "Approved", "Revision"] },
          planType: { type: "string", enum: ["Weekly", "Termly"] },
        },
      },
      Visit: {
        type: "object",
        properties: {
          id: { type: "string", example: "VS-084" },
          student: { type: "string" },
          supervisor: { type: "string" },
          school: { type: "string" },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
          rescheduledDate: { type: "string", format: "date" },
          time: { type: "string", example: "10:00" },
          status: { type: "string", enum: ["Scheduled", "Rescheduled", "Completed", "Missed", "Cancelled", "Draft"] },
        },
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          message: { type: "string" },
          time: { type: "string" },
          read: { type: "boolean" },
          type: { type: "string" },
        },
      },
      StaffInvitationInput: {
        type: "object",
        required: ["name", "email", "staffId", "role", "regions"],
        properties: {
          name: { type: "string", example: "Dr. Linda Antwi" },
          email: { type: "string", format: "email", example: "linda.antwi@aamusted.edu.gh" },
          staffId: { type: "string", example: "STA-0203" },
          role: { type: "string", enum: ["coordinator", "supervisor"] },
          regions: { type: "array", items: { type: "string" }, example: ["Ashanti", "Bono"] },
        },
      },
      WorkflowData: {
        type: "object",
        properties: {
          students: { type: "array", items: { $ref: "#/components/schemas/Student" } },
          placements: { type: "array", items: { $ref: "#/components/schemas/Placement" } },
          notes: { type: "array", items: { $ref: "#/components/schemas/LessonNote" } },
          visits: { type: "array", items: { $ref: "#/components/schemas/Visit" } },
          notifications: { type: "array", items: { $ref: "#/components/schemas/Notification" } },
        },
      },
    },
  },
};
