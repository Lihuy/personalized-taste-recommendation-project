from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, EmailField
from wtforms.validators import DataRequired, Length, Email, Regexp, ValidationError

def is_strong_password(form, field):
    """Custom validator for password strength."""
    # Check if the password contains at least one digit, one letter, and one special character
    if not (any(char.isdigit() for char in field.data) and
            any(char.isalpha() for char in field.data) and
            any(not char.isalnum() for char in field.data)):
        raise ValidationError('Password must contain letters, numbers, and special characters.')
    # Check if the password is at least 8 characters long
    if len(field.data) < 8:
        raise ValidationError('Password must be at least 8 characters long.')

class RegistrationForm(FlaskForm):
    # Regular expression to allow only letters (uppercase and lowercase) and spaces
    # ^[A-Za-z\s]+$ means:
    # ^       - Start of the string
    # [A-Za-z\s] - Match any uppercase letter (A-Z), lowercase letter (a-z), or whitespace character (\s)
    # +       - Match one or more of the preceding characters
    # $       - End of the string
    name_regex = r'^[A-Za-z\s]+$'
    name_error_message = 'Both first and last name must contain only letters!'

    firstName = StringField(
        'First Name',
        validators=[
            DataRequired(),
            Length(max=100),
            Regexp(name_regex, message=name_error_message) # Add Regexp validator for first name
        ]
    )
    lastName = StringField(
        'Last Name',
        validators=[
            DataRequired(),
            Length(max=100),
            Regexp(name_regex, message=name_error_message) # Add Regexp validator for last name
        ]
    )
    email = EmailField(
        'Email Address',
        validators=[
            DataRequired(),
            Email(),
            Length(max=120)
        ]
    )
    password = PasswordField(
        'Password',
        validators=[
            DataRequired(),
            is_strong_password # Use the custom strong password validator
        ]
    )