# Taste Tailor

Taste Tailor is a web-based application aimed at providing quick, personalized meal recommendations for tech-savvy users (primarily millennials and Gen Z). The system employs a content-based filtering algorithm to suggest menu items tailored to individual taste profiles.

## Project Stack

- **Frontend:** Next.js (React Framework), Tailwind CSS (Styling)
- **Backend:** Flask (Python Web Framework), Flask-SQLAlchemy (ORM)
- **Database:** [Specify the type, e.g., SQLite, PostgreSQL, MySQL]

## Features

- Authentication
- Profile Management
- Menu Browsing
- Recommendation
- Ordering Simulation

## Prerequisites

Make sure you have the following installed:

- Git ([Link to download](https://git-scm.com/downloads))
- Node.js (vXX.X or later) ([Link to download](https://nodejs.org/))
- Python (vX.X or later) ([Link to download](https://www.python.org/downloads/))

## Setup

Follow these steps to set up the application on your local machine:

1.  **Extract the zip file.**
    Unzip the downloaded application file to a directory on your computer.

2.  **Backend Setup:**

    Open your terminal or command prompt.
    Navigate into the `backEnd` directory of the extracted project:

    ```bash
    cd backEnd
    ```

    **Create and Activate a Python Virtual Environment:**
    It's best practice to use a virtual environment to manage backend dependencies separately.

    ```bash
    # On macOS and Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

    ```bash
    # On Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```

    _(Ensure `(venv)` appears in your terminal prompt)_

    Install dependencies:

    ```bash
    pip install -r requirements.txt
    ```

    **Configure Backend Environment Variables:**
    The backend requires configuration via environment variables.

    - Create a new file named `.env` in the `backEnd` directory.

    Edit the `.env` file with your secret key, google and facebook client id/key, etc.

    - Open the new `.env` file in a text editor and fill in the required values. Crucial variables will likely include:
      - `SECRET_KEY=[a_random_string_for_security]`
      - `DATABASE_URL=[your_database_connection_string]` (e.g., `sqlite:///site.db` for SQLite)
      - [Add any other specific environment variables required by the backEnd]

    ```bash
    # This is a template for .env
    # Flask Secret Key: Used for securing sessions and other security-related functions.
    SECRET_KEY='your_flask_secret_key_here'
    # Get GOOGLE_CLIENT_ID from ([Google](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid#get_your_google_api_client_id))
    GOOGLE_CLIENT_ID="your_google_client_id"
    GOOGLE_CLIENT_SECRET="your_google_client_secret"
    # Get FACEBOOK_CLIENT_ID from ([Facebook](https://composio.dev/auth/facebook))
    FACEBOOK_CLIENT_ID="your_facebook_client_id"
    FACEBOOK_CLIENT_SECRET="your_facebook_client_secret"
    UPLOAD_FOLDER = 'uploads/profile_pictures'
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
    ```

    **Run the backEnd application:**
    If everything set up, you can run the application on port 5000 bt default:

    ```bash
    python3 app.py
    ```

3.  **Frontend Setup:**

    Open a **new terminal or command prompt**.

    Open a **new terminal or command prompt window**.
    Navigate into the `frontEnd` directory of the extracted project:

    ```bash
    cd frontEnd
    ```

    ```bash
    cd taste_tailor
    ```

    **Install Frontend Dependencies:**
    Install the required Node.js packages using npm (or yarn/pnpm if that's what your project uses — check `package.json` or project documentation):

    ```bash
    npm install
    # OR yarn install
    # OR npm install
    ```

    **Run the frontEnd application:**
    If everything set up, you can run the application on port 3000 by default:

    ```bash
    npm run dev
    ```
