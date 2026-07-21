# Task Management System (TMS)

A full-stack, enterprise-grade Task Management System built with a secure **Django REST Framework (DRF)** backend and a dynamic **React** frontend SPA.

---

## 🚀 Key Features

* **Role-Based Access Control (RBAC):** Rich RBAC structure allowing creation of custom roles and modules-based system permissions (e.g., `manage_users`, `manage_roles`).
* **Resilient Hybrid Logging:** Split-responsibility logging system:
  * **System activity logs (`tms.log`):** Human-readable system audits formatted using a custom layman-friendly template.
  * **Database logs (`AuditLog` and `SystemErrorLog`):** High-level structured audit rows and backend exception tracebacks.
  * **Fail-Safe Fallback:** Automatically redirects database-write logs to local disk file if Postgres crashes. API fallback reads and parses local logs directly from the server disk if database queries fail.
* **Global Exception Mapping:** Centralized exception handler mapper (`global_api_exception_handler`) that captures custom business exceptions (`TMSApiException`) and database connection outages, mapping them to standard API-first JSON payloads (e.g., `is_database_down: true`).
* **Task & Project Workflows:** Full status modification controls, assigned tasks isolation for Developers, and dynamic custom status checking.

---

## 🛠️ Tech Stack

* **Backend:** Python, Django, Django REST Framework (DRF), SimpleJWT (JWT Authentication), PostgreSQL.
* **Frontend:** React, Vanilla CSS (with dark/light theme integration), Axios (with response interceptors), React Router DOM.

---

## ⚙️ Installation & Setup

### 1. Backend Setup
1. Navigate to the project root directory.
2. Initialize and activate a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure database settings in your local `.env` file:
   ```ini
   DB_NAME=task_management
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=127.0.0.1
   DB_PORT=5432
   ```
5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the server:
   ```bash
   python manage.py runserver
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🧪 Running Tests

To run the backend test suite (which includes verification of RBAC permissions, token blacklisting, and global logging database-down mocks):
```bash
python manage.py test
```
