export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "FuoLearn API",
    version: "0.1.0",
    description: "Learning platform API for Federal University Otuoke",
  },
  servers: [
    {
      url: "/api",
      description: "API base",
    },
  ],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "firstName", "lastName", "role"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  role: { type: "string", enum: ["admin", "professor", "student"] },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Account created (pending approval)" },
          "409": { description: "Email already exists" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful" },
          "401": { description: "Invalid credentials or inactive account" },
        },
      },
    },
    "/auth/users": {
      get: {
        tags: ["Admin"],
        summary: "List all users",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "List of users" },
        },
      },
    },
    "/auth/users/pending": {
      get: {
        tags: ["Admin"],
        summary: "List pending users",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "List of pending users" },
        },
      },
    },
    "/auth/users/{id}/approve": {
      patch: {
        tags: ["Admin"],
        summary: "Approve a pending user",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "User approved" },
          "404": { description: "User not found" },
        },
      },
    },
    "/auth/users/{id}/disable": {
      patch: {
        tags: ["Admin"],
        summary: "Disable a user",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "User disabled" },
          "404": { description: "User not found" },
        },
      },
    },
    "/courses": {
      get: {
        tags: ["Courses"],
        summary: "List all courses",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "List of courses" },
        },
      },
      post: {
        tags: ["Courses", "Admin"],
        summary: "Create a course (admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "code", "professorId"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  code: { type: "string" },
                  professorId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Course created" },
          "409": { description: "Course code already exists" },
        },
      },
    },
    "/courses/{id}": {
      get: {
        tags: ["Courses"],
        summary: "Get a course by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Course details" },
          "404": { description: "Course not found" },
        },
      },
      patch: {
        tags: ["Courses"],
        summary: "Update a course (admin or assigned professor)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  code: { type: "string" },
                  professorId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Course updated" },
          "403": { description: "Not your course" },
          "404": { description: "Course not found" },
        },
      },
      delete: {
        tags: ["Courses"],
        summary: "Delete a course (admin or assigned professor)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "204": { description: "Course deleted" },
          "403": { description: "Not your course" },
          "404": { description: "Course not found" },
        },
      },
    },
    "/courses/{id}/enroll": {
      post: {
        tags: ["Enrollments", "Student"],
        summary: "Request enrollment in a course (student only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "201": { description: "Enrollment request created" },
          "409": { description: "Already enrolled or pending" },
        },
      },
    },
    "/courses/{id}/enrollments": {
      get: {
        tags: ["Enrollments", "Professor"],
        summary: "List enrollment requests for a course (professor/admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "List of enrollments" },
        },
      },
    },
    "/courses/{id}/materials": {
      get: {
        tags: ["Materials"],
        summary: "List materials for a course (enrolled/professor/admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "List of materials" },
        },
      },
      post: {
        tags: ["Materials", "Professor"],
        summary: "Upload a material (professor/admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["title", "file"],
                properties: {
                  title: { type: "string" },
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Material uploaded" },
          "400": { description: "Invalid file type" },
        },
      },
    },
    "/materials/{id}": {
      delete: {
        tags: ["Materials", "Professor"],
        summary: "Delete a material (uploader/admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "204": { description: "Material deleted" },
          "403": { description: "Not the uploader" },
          "404": { description: "Material not found" },
        },
      },
    },
    "/quizzes": {
      post: {
        tags: ["Quizzes", "Professor"],
        summary: "Create a quiz (professor/admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["courseId", "title"],
                properties: {
                  courseId: { type: "string", format: "uuid" },
                  title: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Quiz created" },
        },
      },
    },
    "/quizzes/{id}": {
      get: {
        tags: ["Quizzes"],
        summary: "Get quiz details",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Quiz details" },
          "404": { description: "Quiz not found" },
        },
      },
      patch: {
        tags: ["Quizzes", "Professor"],
        summary: "Update a quiz (professor/admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Quiz updated" },
          "403": { description: "Not your quiz" },
        },
      },
      delete: {
        tags: ["Quizzes", "Professor"],
        summary: "Delete a quiz (professor/admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "204": { description: "Quiz deleted" },
          "403": { description: "Not your quiz" },
        },
      },
    },
    "/quizzes/{id}/publish": {
      post: {
        tags: ["Quizzes", "Professor"],
        summary: "Publish a quiz (professor/admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Quiz published" },
          "400": { description: "No questions yet" },
        },
      },
    },
    "/quizzes/{id}/unpublish": {
      post: {
        tags: ["Quizzes", "Professor"],
        summary: "Unpublish a quiz (professor/admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Quiz unpublished" },
        },
      },
    },
    "/quizzes/{id}/questions": {
      get: {
        tags: ["Quizzes"],
        summary: "Get quiz questions",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "List of questions" },
        },
      },
      post: {
        tags: ["Quizzes", "Professor"],
        summary: "Add a question to a quiz (professor/admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["question", "options", "correctAnswer"],
                properties: {
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" }, minItems: 2 },
                  correctAnswer: { type: "string" },
                  explanation: { type: "string" },
                  sortOrder: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Question added" },
          "400": { description: "correctAnswer not in options" },
        },
      },
    },
    "/materials/{id}/generate-quiz": {
      post: {
        tags: ["Quizzes", "Professor", "AI"],
        summary: "Generate a quiz from material using AI (professor/admin)",
        description: "Extracts text from the uploaded material and sends it to Gemini to generate quiz questions",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  numberOfQuestions: { type: "integer", minimum: 1, maximum: 20, description: "Number of questions to generate (default: 10)" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Quiz generated and saved" },
          "400": { description: "Extraction or generation failed" },
          "403": { description: "Not the material uploader" },
          "404": { description: "Material not found" },
        },
      },
    },
    "/courses/{id}/quizzes": {
      get: {
        tags: ["Quizzes"],
        summary: "List quizzes for a course",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "List of quizzes" },
        },
      },
    },
    "/quizzes/{id}/attempts": {
      post: {
        tags: ["Quiz Attempts", "Student"],
        summary: "Start a quiz attempt (student only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "201": { description: "Attempt started" },
          "400": { description: "Quiz not published" },
        },
      },
    },
    "/attempts/{id}/submit": {
      post: {
        tags: ["Quiz Attempts", "Student"],
        summary: "Submit quiz answers (student only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["answers"],
                properties: {
                  answers: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["questionId", "selectedAnswer"],
                      properties: {
                        questionId: { type: "string", format: "uuid" },
                        selectedAnswer: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Score returned" },
          "400": { description: "Attempt already completed" },
        },
      },
    },
    "/attempts/{id}": {
      get: {
        tags: ["Quiz Attempts"],
        summary: "Get attempt details with answers",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Attempt details" },
        },
      },
    },
    "/attempts/mine": {
      get: {
        tags: ["Quiz Attempts", "Student"],
        summary: "View all my quiz attempts",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "List of attempts" },
        },
      },
    },
    "/enrollments/mine": {
      get: {
        tags: ["Enrollments", "Student"],
        summary: "View my enrollment status across courses",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "List of student enrollments" },
        },
      },
    },
    "/enrollments/{id}/status": {
      patch: {
        tags: ["Enrollments", "Professor"],
        summary: "Approve or reject enrollment (professor/admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["approved", "rejected"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Enrollment updated" },
          "400": { description: "Enrollment not pending" },
          "404": { description: "Enrollment not found" },
        },
      },
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
  },
};
