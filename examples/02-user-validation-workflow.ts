/**
 * User Validation Workflow Example
 *
 * This example demonstrates how to build a comprehensive user validation
 * workflow that checks multiple conditions before allowing user registration.
 *
 * Use Case: User registration and validation system
 */

import { Flow, SetVariable, Split, Compare, CustomWidget } from '../src';

// Type definitions
interface UserInput {
  email: string;
  password: string;
  name: string;
  age: number;
}

interface PasswordChecks {
  minLength: boolean;
  upperCase: boolean;
  lowerCase: boolean;
  number: boolean;
  specialChar: boolean;
}

interface CreatedUser {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  status: string;
}

interface ValidationError {
  type: string;
  timestamp: string;
}

interface WorkflowPayload {
  user: UserInput;
  emailValid?: boolean;
  passwordStrong?: boolean;
  passwordChecks?: PasswordChecks;
  userExists?: boolean;
  createdUser?: CreatedUser;
  success?: boolean;
  errors?: ValidationError[];
}

interface WorkflowData {
  payload: WorkflowPayload;
  variables?: {
    userEmail?: string;
    userName?: string;
  };
}

// Custom widget for email validation
class ValidateEmailWidget extends CustomWidget {
  async process(data: WorkflowData): Promise<void> {
    const email = data.payload.user?.email || '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const isValid = emailRegex.test(email);

    data.payload.emailValid = isValid;

    if (isValid) {
      this.register(`Email validation passed: ${email}`, 'info');
    } else {
      this.register(`Email validation failed: ${email}`, 'warn');
    }

    await super.process(data);
  }
}

// Custom widget for password strength validation
class ValidatePasswordWidget extends CustomWidget {
  async process(data: WorkflowData): Promise<void> {
    const password = data.payload.user?.password || '';

    // Check password strength
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const isStrong = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

    data.payload.passwordStrong = isStrong;
    data.payload.passwordChecks = {
      minLength: hasMinLength,
      upperCase: hasUpperCase,
      lowerCase: hasLowerCase,
      number: hasNumber,
      specialChar: hasSpecialChar,
    };

    if (isStrong) {
      this.register('Password strength validation passed', 'info');
    } else {
      this.register('Password strength validation failed', 'warn');
    }

    await super.process(data);
  }
}

// Custom widget to check if user exists in database
class CheckUserExistsWidget extends CustomWidget {
  async process(data: WorkflowData): Promise<void> {
    const email = data.payload.user?.email || '';

    // Simulate database check
    const existingUsers = ['existing@example.com', 'test@example.com'];
    const userExists = existingUsers.includes(email.toLowerCase());

    data.payload.userExists = userExists;

    if (userExists) {
      this.register(`User already exists: ${email}`, 'warn');
    } else {
      this.register(`User does not exist: ${email}`, 'info');
    }

    await super.process(data);
  }
}

// Custom widget to create user
class CreateUserWidget extends CustomWidget {
  async process(data: WorkflowData): Promise<void> {
    const user = data.payload.user;

    // Simulate user creation
    const newUser: CreatedUser = {
      id: Math.floor(Math.random() * 10000),
      email: user.email,
      name: user.name,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    data.payload.createdUser = newUser;
    data.payload.success = true;

    this.register(`User created successfully: ${newUser.id}`, 'info');

    await super.process(data);
  }
}

// Custom widget to handle validation errors
class ValidationErrorWidget extends CustomWidget {
  private errorType: string;

  constructor(name: symbol, errorType: string) {
    super(name);
    this.errorType = errorType;
  }

  async process(data: WorkflowData): Promise<void> {
    const errors: ValidationError[] = data.payload.errors || [];

    errors.push({
      type: this.errorType,
      timestamp: new Date().toISOString(),
    });

    data.payload.errors = errors;
    data.payload.success = false;

    this.register(`Validation error: ${this.errorType}`, 'error');

    await super.process(data);
  }
}

// Build the user validation workflow
const buildUserValidationWorkflow = () => {
  // Extract user data variables
  const extractUserData = SetVariable
    .create('extract_user_data')
    .variable('userEmail', '{{ payload.user.email }}')
    .variable('userName', '{{ payload.user.name }}');

  // Validate email
  const validateEmail = ValidateEmailWidget.create('validate_email');

  // Check email validity
  const checkEmailValid = Split
    .create('check_email_valid')
    .case((data: WorkflowData) => Compare
      .is(data.payload.emailValid)
      .equal(true)
    );

  // Email invalid error handler
  const emailInvalidError = new ValidationErrorWidget(Symbol('email_invalid_error'), 'INVALID_EMAIL');

  // Validate password
  const validatePassword = ValidatePasswordWidget.create('validate_password');

  // Check password strength
  const checkPasswordStrong = Split
    .create('check_password_strong')
    .case((data: WorkflowData) => Compare
      .is(data.payload.passwordStrong)
      .equal(true)
    );

  // Password weak error handler
  const passwordWeakError = new ValidationErrorWidget(Symbol('password_weak_error'), 'WEAK_PASSWORD');

  // Check if user already exists
  const checkUserExists = CheckUserExistsWidget.create('check_user_exists');

  // Split based on user existence
  const checkUserDoesNotExist = Split
    .create('check_user_does_not_exist')
    .case((data: WorkflowData) => Compare
      .is(data.payload.userExists)
      .equal(false)
    );

  // User exists error handler
  const userExistsError = new ValidationErrorWidget(Symbol('user_exists_error'), 'USER_ALREADY_EXISTS');

  // Check age restriction
  const checkAgeRestriction = Split
    .create('check_age_restriction')
    .case((data: WorkflowData) => {
      const age = data.payload.user?.age || 0;
      return Compare.is(age).greaterThan(17);
    });

  // Age restriction error handler
  const ageRestrictionError = new ValidationErrorWidget(Symbol('age_restriction_error'), 'UNDERAGE_USER');

  // Create user if all validations pass
  const createUser = CreateUserWidget.create('create_user');

  // Build the workflow chain
  extractUserData.moveTo(validateEmail);

  validateEmail.moveTo(checkEmailValid);
  checkEmailValid
    .moveTo(validatePassword)
    .elseMoveTo(emailInvalidError);

  validatePassword.moveTo(checkPasswordStrong);
  checkPasswordStrong
    .moveTo(checkUserExists)
    .elseMoveTo(passwordWeakError);

  checkUserExists.moveTo(checkUserDoesNotExist);
  checkUserDoesNotExist
    .moveTo(checkAgeRestriction)
    .elseMoveTo(userExistsError);

  checkAgeRestriction
    .moveTo(createUser)
    .elseMoveTo(ageRestrictionError);

  // Create and return the flow
  return Flow.create('user_validation_workflow')
    .start(extractUserData)
    .end();
};

// Example execution with valid user
const runValidUserExample = async () => {
  console.log('=== Valid User Registration ===\n');

  const workflow = buildUserValidationWorkflow();

  const result = await workflow({
    user: {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      name: 'Alice Johnson',
      age: 25,
    },
  });

  console.log('Result:');
  console.log(JSON.stringify(result, null, 2));
};

// Example execution with invalid user
const runInvalidUserExample = async () => {
  console.log('\n=== Invalid User Registration (Weak Password) ===\n');

  const workflow = buildUserValidationWorkflow();

  const result = await workflow({
    user: {
      email: 'another@example.com',
      password: 'weak',
      name: 'Bob Smith',
      age: 30,
    },
  });

  console.log('Result:');
  console.log(JSON.stringify(result, null, 2));
};

// Example execution with existing user
const runExistingUserExample = async () => {
  console.log('\n=== Existing User Registration ===\n');

  const workflow = buildUserValidationWorkflow();

  const result = await workflow({
    user: {
      email: 'existing@example.com',
      password: 'SecurePass123!',
      name: 'Existing User',
      age: 28,
    },
  });

  console.log('Result:');
  console.log(JSON.stringify(result, null, 2));
};

// Run all examples
const runAllExamples = async () => {
  await runValidUserExample();
  await runInvalidUserExample();
  await runExistingUserExample();
};

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export { buildUserValidationWorkflow, runValidUserExample, runInvalidUserExample, runExistingUserExample };
