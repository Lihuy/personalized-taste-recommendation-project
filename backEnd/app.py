from flask import Flask, jsonify, request, url_for, redirect, session, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from authlib.integrations.flask_client import OAuth
from flask_cors import CORS # Removed cross_origin import as we are using global CORS
from flask_wtf.csrf import generate_csrf, validate_csrf, CSRFProtect
from dotenv import load_dotenv
from datetime import datetime # Import datetime
import json # Import json for handling list data
from form import RegistrationForm # Assuming form.py is in the same directory or accessible
import os
import base64
import re

#Attempt to import generate_token instead of generate_nonce
try:
    from authlib.common.security import generate_token as generate_nonce # Use generate_token and alias it as generate_nonce for consistency
except ImportError:
    #Fallback for older Authlib versions if needed, though generate_token is more common now
    from authlib.common.security import generate_nonce

load_dotenv()
app = Flask(__name__)

# --- Flask-CORS Configuration ---
# Configure CORS to allow credentials from frontend's origin
# If frontend is on a different port or domain, update the origins list
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])
# --- End Flask-CORS Configuration ---

# --- Flask Configuration for CSRF and Sessions ---
# Set a SECRET_KEY for CSRF protection and Sessions to work.
# It should be a long, random string. Ensure this is set and secret.
# For development, loading from .env is okay, but ensure the .env file exists
# and contains a SECRET_KEY.
secret_key = os.environ.get("SECRET_KEY")
if not secret_key:
    # Fallback for development if .env is missing or key is not set
    secret_key = os.urandom(24)

app.config["SECRET_KEY"] = secret_key

# Enable CSRF protection. This is usually True by default if SECRET_KEY is set,
# but it's good to be explicit.
app.config['WTF_CSRF_ENABLED'] = True

# Tell Flask-WTF to check for the CSRF token in the JSON body for POST requests.
# This is crucial when frontend sends data as JSON instead of form data.
app.config['WTF_CSRF_CHECK_JSON'] = True

# Flask Session Configuration
app.config["SESSION_PERMANENT"] = True # Suggested Change for Testing (was True already in PDF)
app.config["SESSION_TYPE"] = "filesystem" # Okay for development
# --- End Flask Session Configuration ---
app.config['SERVER_NAME'] = 'localhost:5000' # Ensure this matches backend's host and port - Only needed if using url_for(_external=True) outside of a request context or with subdomains

upload_folder = os.environ.get("UPLOAD_FOLDER")
allowed_extensions = os.environ.get("ALLOWED_EXTENSIONS") # Corrected variable name back to ALLOWED_EXTENSIONS

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config['UPLOAD_FOLDER'] = upload_folder

db = SQLAlchemy(app)
migrate = Migrate(app, db)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login" #Assuming a 'login' route for the login page

# Initialize CSRFProtect after configuring the app and app.config (moved up for clarity)
csrf = CSRFProtect(app)
oauth = OAuth(app)

class Users(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    firstName = db.Column(db.String(150), nullable=False)
    lastName = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(300), unique=False, nullable=False) # unique=False here, consider making it True for user accounts
    password = db.Column(db.String(200), nullable=False)
    profile_picture_filename = db.Column(db.String)
    # --- NEW COLUMNS FOR OAuth IDs ---
    google_id = db.Column(db.String(255), unique=True, nullable=True)
    facebook_id = db.Column(db.String(255), unique=True, nullable=True)
    # --- END NEW COLUMNS ---
    # Add a relationship to the OrderItem model
    order_items = db.relationship('OrderItem', backref='customer', lazy=True)

    def set_password(self, password):
        self.password = generate_password_hash(password, method="pbkdf2:sha256") # Corrected attribute name

    def check_password(self, password):
        return check_password_hash(self.password, password) # Corrected attribute name

    def __repr__(self):
        return '<Users %r>' % self.id

#Define the OrderItem model to store individual items within an order
class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False) # Link to the user who placed the order
    item_name = db.Column(db.String(255), nullable=False)
    item_image_url = db.Column(db.String(500))
    quantity = db.Column(db.Integer, nullable=False)
    price_per_item = db.Column(db.Float, nullable=False)
    total_item_price = db.Column(db.Float, nullable=False) #Price quantity for this item
    delivered_date = db.Column(db.DateTime, nullable=False, default=datetime.now()) # Use datetime, default to now
    taste_selection = db.Column(db.String(500)) #Store tastes as JSON string
    recommended_selection = db.Column(db.String(500)) # Store recommended as JSON string
    rating = db.Column(db.Integer, nullable=False, default=0) # Initial rating is 0
    order_total_price = db.Column(db.Float, nullable=False) #Store the total price of the entire order with fees
    delivery_address = db.Column(db.String(500)) # Store the delivery address details as JSON string
    review_comment = db.Column(db.Text) # New column for review comment

    def __repr__(self):
        return f"<OrderItem {self.id} - {self.item_name}>"

def generate_nonce():
    #Generates a secure, URL-safe nonce
    return base64.urlsafe_b64encode(os.urandom(24)).decode('utf-8')

@login_manager.user_loader
def load_user(user_id):
    return Users.query.get_or_404(int(user_id))

# --- NEW ENDPOINT TO GET CSRF TOKEN ---
@app.route('/get-csrf-token', methods=['GET'])
def get_csrf():
    """Endpoint to provide a CSRF token to the frontend."""
    # generate_csrf() requires a SECRET_KEY to be set in Flask config
    # When generate_csrf() is called, Flask-WTF stores a token in the session.
    token = generate_csrf()
    return jsonify({'csrf_token': token})
# --- END NEW ENDPOINT ---

@app.route('/taste_tailor_register', methods=["POST"])
def register():
    json_data = request.get_json()
    form = RegistrationForm(data=json_data)

    if form.validate():
        firstName = form.firstName.data
        lastName = form.lastName.data
        email = form.email.data
        password = form.password.data

        # Check if email already exists
        # Note: Users model has unique=False for email. Consider changing this.
        if Users.query.filter_by(email=email).first():
            return jsonify({"message": "Email address is already registered."}), 409 # Conflict status code

        # Hash the password
        hashed_password = generate_password_hash(password, method="pbkdf2:sha256") # Corrected method name

        # Create a new user instance
        new_user = Users(firstName=firstName, lastName=lastName, email=email, password=hashed_password)

        # Add the new user to the database session and commit
        db.session.add(new_user)
        db.session.commit()

        # Return success response
        return jsonify({"message": "Registration successful."}), 201 # Created status code

    else:
        # If form validation fails, return validation errors
        errors = {}
        for field, error_list in form.errors.items():
            errors[field] = error_list
        # Return all errors, including csrf_token if present
        # Exclude csrf_token error from the response shown to the user if it's the only error
        # This logic was slightly off in the PDF, correcting it.
        if 'csrf_token' in errors and len(errors) == 1:
             return jsonify({'message': 'Validation failed (CSRF token missing).'}), 400
        return jsonify({'errors': errors, 'message': 'Validation failed'}), 400

#Modified to accept GET requests as well
@app.route("/taste_tailor_login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        data = request.get_json()
        if not data:
            return jsonify({"message": "Invalid JSON data"}), 400

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"message": "Username and password are required"}), 400

        user = Users.query.filter_by(email=email).first()

        if not user:
            return jsonify({"message": "The user with the provided email didn't exist"}), 409
        
        if user and check_password_hash(user.password, password):
            login_user(user)
            #Flask-Login handles setting the session cookie here
            login_response = {
                'message': 'Login successful',
                'profile': f'Welcome, {user.firstName}', # Corrected f-string syntax
                'firstName': user.firstName, # Corrected attribute name
                'lastName': user.lastName, # Corrected attribute name
                'email': user.email, # Corrected attribute name
                'id': user.id, # Corrected attribute name
                'profilePicture': user.profile_picture_filename, # Corrected attribute name
            }

            #After successful login, redirect to the 'next' URL if provided by Flask-Login
            next_url = request.args.get('next')

            if next_url:
                return redirect(next_url)
            else:
                # If no 'next' URL, return the JSON response for the frontend to handle
                return jsonify(login_response), 200
        else:
            return jsonify({"message": "Invalid email or password" }), 401 # Unauthorized status code
    else: # Handle GET request for login page
        #This route is primarily for Flask-Login's internal redirect.
        #If a user directly accesses this with GET, might want to return an HTML page
        # or a simple message indicating it's a login endpoint.
        #Returning a 200 with a message is fine for debugging, but for production,
        #Likely render an HTML login form or redirect to the frontend login page.
        return jsonify({"message": "Login endpoint. Please use POST to authenticate."}), 200

if not os.path.exists(upload_folder):
    os.makedirs(upload_folder)

#Helper function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

@app.route('/taste_tailor_update_picture', methods=['POST'])
def update_picture():
    if 'profilePicture' not in request.files:
        return jsonify({"error": "No profile Picture file part in the request" }), 400 #Bad Request

    file = request.files['profilePicture']
    user_id = request.form.get('userID') #Access text field from request.form

    if user_id is None:
        return jsonify({"error": "userID is required"}), 400 # Bad Request

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400 # Bad Request

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        try:
            file.save(filepath)

            user = Users.query.get_or_404(user_id)

            if user is None:
                os.remove(filepath) # Clean up the saved file if user not found
                return jsonify({"message": "User not found"}), 404

            user.profile_picture_filename = filename
            db.session.commit()

            return jsonify({"message": "Profile picture updated successfully", "filename": filename}), 200 # OK

        except Exception as e:
            db.session.rollback() # Roll back database changes if save or commit fails
            print(f"Error saving file or updating database: {e}")

            #Attempt to remove the file if it was saved but DB update failed
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except Exception as cleanup_e:
                    print(f"Error cleaning up file {filepath}: {cleanup_e}")

            return jsonify({"error": "An error occurred during file upload or database update" }), 500 # Internal Server Error
    else:
        return jsonify({"error": "Invalid file type"}), 400 # Bad Request

@app.route('/uploads/profile_pictures/<filename>')
def uploaded_file(filename):
    try:
        #Prevent serving invalid filenames like "null" or empty strings
        if not filename or filename == 'null':
            #print(f"Attempted to serve invalid filename: {filename}") # Corrected f-string
            return "Invalid file request", 400 #Or 404, depending on desired behavior

        # Use send_from_directory to safely serve the file
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    except FileNotFoundError:
        #Explicitly handle FileNotFoundError and return 404
        print(f"File not found in upload folder: {filename}") # Corrected f-string
        return "File not found", 404

    except Exception as e:
        #Catch any other unexpected errors during file serving
        print(f"Error serving file {filename}: {e}") # Corrected f-string
        return "Internal server error", 500

@app.route('/taste_tailor_update_info', methods=['PUT'])
def update_info():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 415 # Unsupported Media Type

    data = request.get_json()
    user_id = data.get('id')

    if user_id is None:
        return jsonify({"error": "User ID is required for update"}), 400

    user = Users.query.get_or_404(user_id)

    if user is None:
        return jsonify({"message": "User not found" }), 404

    updated_fields = False
    errors = {} # Dictionary to collect validation errors
    name_regex = r'^[A-Za-z\s]+$' # Define the regex for names (letters)
    name_error_message = 'Both first and last name must contain only letters!'

    # --- First Name Validation ---
    if 'firstName' in data and data['firstName'] is not None:
        firstName_to_update = data['firstName'].strip() # Strip whitespace
        if not firstName_to_update: # Check if empty after stripping
             errors['firstName'] = ['First name cannot be empty.']
        elif not re.match(name_regex, firstName_to_update):
             errors['firstName'] = [name_error_message]
        else:
            user.firstName = firstName_to_update
            updated_fields = True
    # --- End First Name Validation ---

    # --- Last Name Validation ---
    if 'lastName' in data and data['lastName'] is not None:
        lastName_to_update = data['lastName'].strip() # Strip whitespace
        if not lastName_to_update: # Check if empty after stripping
             errors['lastName'] = ['Last name cannot be empty.']
        elif not re.match(name_regex, lastName_to_update):
             errors['lastName'] = [name_error_message]
        else:
            user.lastName = lastName_to_update
            updated_fields = True
    # --- End Last Name Validation ---

    # --- Email Validation ---
    if 'email' in data and data['email'] is not None:
        email_to_update = data['email'].strip() # Strip whitespace
        # Basic email format validation using regex
        email_regex = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        if not re.match(email_regex, email_to_update):
            errors['email'] = ['Invalid email format.']
        else:
            # Check if the email is already registered by another user
            existing_user = Users.query.filter_by(email=email_to_update).first()
            # Ensure the existing user is not the current user being updated
            if existing_user and existing_user.id != user.id:
                errors['email'] = ['Email address is already registered.']
            else:
                # If validation passes, update the email
                user.email = email_to_update
                updated_fields = True
    # --- End Email Validation ---

    if errors:
        # If there are any validation errors (currently only email), return them
        return jsonify({'errors': errors, 'message': 'Validation failed'}), 400

    if not updated_fields:
        return jsonify({"message": "No fields provided for update"}), 200 # OK

    try:
        db.session.commit()
        # Ensure current_user is available if needed here (requires login_required)
        # If this route is not login_required, might not have current_user
        update_info_response = {
            'message': 'Successfully updated personal info',
            'firstName': user.firstName, # Use user object if current_user not guaranteed
            'lastName': user.lastName,
            'email': user.email,
        }
        return jsonify(update_info_response), 200 # OK
    except Exception as e:
        db.session.rollback() # Roll back changes if something goes wrong
        print(f"Database error during update: {e}")
        return jsonify({"error": "Database error during update"}), 500

@app.route('/taste_tailor_update_password', methods=['PUT'])
def update_password():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 415 # Unsupported Media Type

    data = request.get_json()
    user_id = data.get('id')
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')

    if None in [user_id, old_password, new_password, confirm_password]:
        return jsonify({"error": "User ID, old, new, and confirm password are required"}), 400 # Bad Request
    
    if len(old_password) < 8:
        return jsonify({"error": "Old password must be at least 8 characters long."}), 400
    
    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters long."}), 400
    
    if len(confirm_password) < 8:
        return jsonify({"error": "Confirmation password must be at least 8 characters long."}), 400
    
    # Check character types: letters, numbers, and special characters
    # `any(not char.isalnum() for char in new_password)` checks for special characters
    # by finding if any character is *not* alphanumeric.
    if not (any(char.isdigit() for char in old_password) and
            any(char.isalpha() for char in old_password) and
            any(not char.isalnum() for char in old_password)):
        return jsonify({"error": "Old password must contain letters, numbers, and special characters."}), 400
    
    if not (any(char.isdigit() for char in new_password) and
            any(char.isalpha() for char in new_password) and
            any(not char.isalnum() for char in new_password)):
        return jsonify({"error": "New password must contain letters, numbers, and special characters."}), 400
    
    if not (any(char.isdigit() for char in confirm_password) and
            any(char.isalpha() for char in confirm_password) and
            any(not char.isalnum() for char in confirm_password)):
        return jsonify({"error": "Confirmation password must contain letters, numbers, and special characters."}), 400
    # --- End Strong Password Validation ---
    
    user = Users.query.get_or_404(user_id)

    if user is None:
        return jsonify({"message": "User not found"}), 404 # Not Found
    
    if not user.check_password(old_password):
        return jsonify({"error": "Incorrect old password"}), 401 # Unauthorized

    if not new_password == confirm_password:
        return jsonify({"error": "New password and confirm password do not match"}), 400

    try:
        user.set_password(new_password)
        db.session.commit()
        return jsonify({"message": "Password updated successfully"}), 200 # OK
    except Exception as e:
        db.session.rollback() # Roll back changes if something goes wrong
        print(f"Database error during password update: {e}")
        return jsonify({"error": "An error occurred while updating the password"}), 500

# --- Google OAuth Routes ---
@app.route('/google/')
def google():
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
    CONF_URL = 'https://accounts.google.com/.well-known/openid-configuration'

    if 'google' not in oauth._clients:
        oauth.register(
            name='google',
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            server_metadata_url=CONF_URL,
            client_kwargs={
                'scope': 'openid email profile'
            }
        )

    nonce = generate_nonce() # Custom nonce function
    session['nonce'] = nonce # Store custom nonce in the session

    # Redirect to google_auth function
    # Ensure _external=True is used for generating the full callback URL
    redirect_uri = url_for('google_auth', _external=True)

    # Explicitly include nonce in the authorize_redirect call using generate_token (aliased as generate_nonce)
    # Authlib's authorize_redirect should handle storing its own nonce in the session as well.
    return oauth.google.authorize_redirect(redirect_uri, nonce=nonce) # Using custom generate_nonce

@app.route('/google/auth/')
def google_auth():
    try:
        # Retrieve custom nonce from the session
        stored_nonce = session.pop('nonce', None)
        if stored_nonce is None:
            print("Error: Custom Nonce missing from session during Google OAuth callback.")
            # Redirect to frontend with error
            return redirect('http://localhost:3000/auth/login?error=google_auth_failed_nonce_missing')

        # Authenticate the user with Google. Authlib handles its own session state/nonce here.
        token = oauth.google.authorize_access_token()

        # Get user info from ID token, passing custom stored_nonce for verification
        # Authlib will now check if the nonce in the ID token matches stored_nonce
        userinfo = oauth.google.parse_id_token(token, nonce=stored_nonce)

        google_user_id = userinfo.get('sub')
        user_name = userinfo.get('name')
        user_email = userinfo.get('email')
        picture = userinfo.get('picture')

        if not google_user_id or not user_email:
            print("Error: Missing Google User ID or Email in callback.") # Debugging
            # Handle missing info - maybe redirect to an error page or login
            return redirect('http://localhost:3000/auth/login?error=google_auth_failed')

        # Check if the user exists in database
        user = Users.query.filter_by(google_id=google_user_id).first()
        if user:
            # Existing user, log them in using Flask-Login
            login_user(user)
        else:
            # New user, create an account
            # Might want to prompt the user for more info here or set a temporary flag
            # For simplicity, let's create a basic account
            new_user = Users(firstName=user_name.split(' ')[0] if user_name else 'GoogleUser',
                             lastName=user_name.split(' ')[-1] if user_name and len(user_name.split(' ')) > 1 else '',
                             email=user_email,
                             password=generate_password_hash(os.urandom(16).hex()), # Generate a random password for OAuth users
                             profile_picture_filename=picture,
                             google_id=google_user_id)
            db.session.add(new_user)
            db.session.commit()
            login_user(new_user) # Log in the newly created user

        # Redirect back to the frontend callback page
        # The browser should now have the Flask-Login session cookie
        return redirect('http://localhost:3000/auth/google') # Redirect to a frontend route that handles post-login

    except Exception as e:
        print(f"Error during Google OAuth callback: {e}") # Debugging
        # Handle OAuth errors - redirect to an error page or login
        return redirect('http://localhost:3000/auth/login?error=google_auth_error')
# --- End Google OAuth Routes ---

# --- Facebook OAuth Routes ---
@app.route('/facebook/')
def facebook():
    FACEBOOK_CLIENT_ID = os.environ.get('FACEBOOK_CLIENT_ID')
    FACEBOOK_CLIENT_SECRET = os.environ.get('FACEBOOK_CLIENT_SECRET')

    if 'facebook' not in oauth._clients: # Check if 'facebook' client is already registered
        oauth.register(
            name='facebook',
            client_id=FACEBOOK_CLIENT_ID,
            client_secret=FACEBOOK_CLIENT_SECRET,
            access_token_url='https://graph.facebook.com/oauth/access_token',
            access_token_params=None,
            authorize_url='https://www.facebook.com/dialog/oauth',
            authorize_params=None,
            api_base_url='https://graph.facebook.com/',
            client_kwargs={'scope': 'email public_profile'}, # Ensure public_profile is requested for name/ID
        )

    redirect_uri = url_for('facebook_auth', _external=True)
    return oauth.facebook.authorize_redirect(redirect_uri)

@app.route('/facebook/auth/')
def facebook_auth():
    try:
        # Authenticate the user with Facebook
        token = oauth.facebook.authorize_access_token()
        access_token = token.get('access_token')
        if not access_token:
            print("Error: Missing Facebook access token in callback.") # Debugging
            return redirect('http://localhost:3000/auth/login?error=facebook_auth_failed')

        # Use the access token to call the Graph API /me endpoint
        # Specify fields to retrieve (id, name, email, picture)
        user_info_url = f"{oauth.facebook.api_base_url}me?fields=id,name,email,picture"

        user_info_response = oauth.facebook.get(user_info_url, params={'access_token': access_token})
        user_info = None
        facebook_user_id = None
        user_name = None
        user_email = None
        picture_data = None

        if user_info_response.ok:
            user_info = user_info_response.json()

            facebook_user_id = user_info.get('id')
            user_name = user_info.get('name')
            user_email = user_info.get('email') # Email might be None if user didn't grant permission
            picture_data = user_info.get('picture')

            picture_url = None
            if picture_data and 'data' in picture_data and 'url' in picture_data['data']:
                picture_url = picture_data['data']['url']

            if not facebook_user_id:
                print("Error: Missing Facebook User ID in callback.") # Debugging
                return redirect('http://localhost:3000/auth/login?error=facebook_auth_failed')

            # Check if the user exists in database using Facebook ID
            user = Users.query.filter_by(facebook_id=facebook_user_id).first()

            # If user not found by Facebook ID, try by email if available and unique in DB
            # Note: Users model has unique=False for email. If using email as a primary
            # identifier for non-OAuth users, consider making it unique.
            # For OAuth users, using the unique provider ID (google_id, facebook_id) is safer.
            if not user and user_email:
                 user = Users.query.filter_by(email=user_email).first()
                 if user:
                     # If user found by email, link their Facebook ID
                     user.facebook_id = facebook_user_id
                     db.session.commit()
                     login_user(user)
                     return redirect('http://localhost:3000/auth/facebook') # Redirect after linking and login

            if not user:
                # If user not found by Facebook ID AND not found by email (or email not provided)
                new_user = Users(firstName=user_name.split(' ')[0] if user_name else 'FacebookUser',
                                 lastName=user_name.split(' ')[-1] if user_name and len(user_name.split(' ')) > 1 else '',
                                 email=user_email, # Store email if available
                                 password=generate_password_hash(os.urandom(16).hex()), # Generate a random password
                                 profile_picture_filename=picture_url,
                                 facebook_id=facebook_user_id) # Store Facebook ID
                db.session.add(new_user)
                db.session.commit()
                login_user(new_user) # Log in the newly created user
                # Redirect back to the frontend callback page
                return redirect('http://localhost:3000/auth/facebook')

            elif user:
                # Existing user found by Facebook ID, log them in
                login_user(user)
                # Redirect back to the frontend callback page
                return redirect('http://localhost:3000/auth/facebook')

            else:
                 # This case should ideally not be reached if the logic is sound,
                 # but as a fallback, handle the scenario where a user isn't found
                 # and email wasn't provided.
                 print("Error: User not found by Facebook ID or email, and email not provided by Facebook.") # Debugging
                 return redirect('http://localhost:3000/auth/login?error=facebook_email_missing_or_user_not_found')


    except Exception as e:
        print(f"Error during Facebook OAuth callback: {e}") # Debugging
        # Handle OAuth errors - redirect to an error page or login
        return redirect('http://localhost:3000/auth/login?error=facebook_auth_error')
# --- End Facebook OAuth Routes ---

@app.route('/taste_tailor_google_api') # Renamed from api_session for clarity
@login_required # This route requires authentication
def get_authenticated_user():
    """
    Endpoint to check if the user is logged in according to the Flask backend session.
    Returns user data if logged in, otherwise returns an unauthorized response (handled by
    @login_required redirect).
    """
    # If current_user is authenticated by Flask-Login, this function will be reached.
    # If not authenticated, Flask-Login will intercept and redirect to login_view.
    user_data = {
        'isLoggedIn': True,
        'userId': current_user.id,
        'firstName': current_user.firstName,
        'lastName': current_user.lastName,
        'email': current_user.email,
        'profilePicture': current_user.profile_picture_filename,
        # Add other necessary user data
    }
    return jsonify(user_data), 200

@app.route('/taste_tailor_logout')
@login_required # Ensure user is logged in to log out
def logout():
    """
    Logs out the current user using Flask-Login.
    This terminates the Flask session for the user.
    """
    # --- Flask-Login Session Terminated Here ---
    logout_user()
    # Return a JSON response indicating success
    return jsonify({'message': 'Logged out successfully'}), 200

# New route to handle placing an order
@app.route('/place_order', methods=['POST'])
@login_required # Ensure user is logged in to place an order
def place_order():
    """
    Handles incoming POST requests to place an order.
    Expects JSON data containing cart items, delivery address, and order total.
    Saves each item as a separate record in the database.
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 415 # Unsupported Media Type

    data = request.get_json()
    cart_items_data = data.get('cartItems')
    delivery_address_data = data.get('deliveryAddress')
    order_total = data.get('orderTotal')

    # Basic validation of incoming data
    if not cart_items_data or not delivery_address_data or order_total is None:
        return jsonify({"error": "Missing order data (cartItems, deliveryAddress, or orderTotal)"}), 400 # Bad Request

    if not isinstance(cart_items_data, list) or not isinstance(delivery_address_data, dict) or not isinstance(order_total, (int, float)):
        return jsonify({"error": "Invalid data format for order data"}), 400 # Bad Request

    # Get the current logged-in user's ID from Flask-Login's current_user
    user_id = current_user.id

    try:
        # Store delivery address as a JSON string for easier storage and retrieval
        delivery_address_json = json.dumps(delivery_address_data)

        # Iterate through each item in the cart and create an OrderItem record
        for item_data in cart_items_data:
            # Validate essential item data fields
            if not all(key in item_data for key in ['name', 'price', 'quantity']):
                print(f"Skipping invalid item data due to missing fields: {item_data}")
                continue # Skip this item if essential data is missing

            # Store tastes and recommended as JSON strings
            tastes_json = json.dumps(item_data.get('selectedTastes', []))
            recommended_json = json.dumps(item_data.get('selectedRecommended', []))

            # Create a new OrderItem instance
            new_order_item = OrderItem(
                user_id=user_id,
                item_name=item_data.get('name'),
                item_image_url=item_data.get('imageUrl'),
                quantity=item_data.get('quantity'),
                price_per_item=item_data.get('price'),
                total_item_price=item_data.get('price') * item_data.get('quantity'), # Calculate total price for this item
                delivered_date=datetime.now(), # Ensure datetime.now() is called here for the current time
                taste_selection=tastes_json,
                recommended_selection=recommended_json,
                # rating will use the default (0)
                order_total_price=order_total, # Store the total order price with each item (denormalized)
                delivery_address=delivery_address_json # Store the delivery address with each item (denormalized)
            )
            # Add the new item to the database session
            db.session.add(new_order_item)

        # Commit all new order items to the database in a single transaction
        db.session.commit()

        # Return a success response
        return jsonify({"message": "Order placed successfully"}), 201 # Created

    except Exception as e:
        # Roll back the database session in case of any error
        db.session.rollback()
        print(f"Database error during order placement: {e}")
        # Return an error response
        return jsonify({"error": "An error occurred while placing the order"}), 500 # Internal Server Error

# New route to fetch past orders for the logged-in user
@app.route('/get_past_orders', methods=['GET'])
@login_required # Ensure user is logged in
def get_past_orders():
    """
    Fetches past order items for the logged-in user.
    Returns a list of order items ordered by delivered date descending.
    Returns an empty list if no orders are found.
    Includes review_comment if available.
    """
    try:
        # Query OrderItem records for the current user, ordered by delivered_date descending
        past_order_items = OrderItem.query.filter_by(user_id=current_user.id).order_by(OrderItem.delivered_date.desc()).all()

        # If no order items are found, return an empty list
        if not past_order_items:
            return jsonify([]), 200 # Return empty list

        # Serialize the order items into a list of dictionaries
        serialized_order_items = []
        for item in past_order_items:
            serialized_order_items.append({
                'id': item.id,
                'item_name': item.item_name,
                'item_image_url': item.item_image_url,
                'quantity': item.quantity,
                'price_per_item': item.price_per_item,
                'total_item_price': item.total_item_price,
                'delivered_date': item.delivered_date.isoformat(), # Format datetime as ISO string
                'taste_selection': json.loads(item.taste_selection) if item.taste_selection else [], # Load JSON string back to list
                'recommended_selection': json.loads(item.recommended_selection) if item.recommended_selection else [], # Load JSON string back to list
                'rating': item.rating,
                'order_total_price': item.order_total_price,
                'delivery_address': json.loads(item.delivery_address) if item.delivery_address else {}, # Load JSON string back to dict
                'review_comment': item.review_comment # Include review comment
            })

        # Return the list of serialized order items as JSON
        return jsonify(serialized_order_items), 200 # OK

    except Exception as e:
        print(f"Error fetching past orders: {e}")
        return jsonify({"error": "An error occurred while fetching past orders"}), 500 # Internal Server Error

# New route to update the rating and review comment of an order item
@app.route('/submit_review', methods=['POST']) # Using a dedicated endpoint for submitting reviews
@login_required # Ensure user is logged in
def submit_review():
    """
    Updates the rating and review comment for a specific order item.
    Expects JSON data containing order_item_id, rating, and review_comment.
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 415 # Unsupported Media Type

    data = request.get_json()
    order_item_id = data.get('order_item_id')
    rating = data.get('rating')
    review_comment = data.get('review_comment', '') # Get comment, default to empty string

    # Validate incoming data
    if order_item_id is None or rating is None:
        return jsonify({"error": "Missing order_item_id or rating"}), 400 # Bad Request

    if not isinstance(order_item_id, int) or not isinstance(rating, int) or not (0 <= rating <= 5):
        return jsonify({"error": "Invalid data format for order_item_id or rating"}), 400 # Bad Request

    try:
        # Find the order item by ID and ensure it belongs to the current user
        order_item = OrderItem.query.filter_by(id=order_item_id, user_id=current_user.id).first()

        if not order_item:
            return jsonify({"message": "Order item not found or does not belong to the user"}), 404 # Not Found

        # Update the rating and review comment
        order_item.rating = rating
        order_item.review_comment = review_comment # Save the comment
        db.session.commit()

        return jsonify({"message": "Review submitted successfully"}), 200 # OK

    except Exception as e:
        db.session.rollback() # Roll back changes if something goes wrong
        print(f"Database error during review submission: {e}")
        return jsonify({"error": "An error occurred while submitting the review"}), 500 # Internal Server Error

if __name__ == '__main__':
    app.run(debug=True)