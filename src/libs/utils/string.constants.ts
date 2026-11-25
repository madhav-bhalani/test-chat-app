// Auth Messages
export const LoginSuccessfully = 'User has been logged in successfully';
export const LogoutSuccessfully = 'User has been logged out successfully';
export const RegisterSuccessfully = 'User has been registered successfully';
export const InvalidEmail = 'Email is invalid';
export const TokenExpired = 'Token has expired';
export const TokenInvalid = 'Token is invalid';
export const InvalidRefreshToken = 'Invalid refresh token. Please log in again.';
export const ActiveSessionDetectedOnAnotherDevice =
  'Active session detected on another device. Please log in again.';
export const UnauthorizedAccess = 'Unauthorized access';
export const TokenRefreshedSuccessfully = 'Token has been refreshed successfully';
export const InvalidPassword = 'Password is invalid';
export const InvalidCredentials = 'Invalid credentials';
export const InvalidMobileOrEmail = 'Email or Mobile is invalid';
export const InvalidEmailAddress = 'Email address is invalid';
export const AccountInactive = 'Account is inactive, please contact admin.';
export const TokenAccessDenied = 'Your session has ended. Please log in again.';
export const NoActiveSessionDetected = 'No active device session found for this user';
export const RefreshTokenExpired = 'Refresh token has expired. Please log in again.';
export const TokenRequired = 'Authentication token is required';
export const InvalidTokenSignature = 'Invalid token signature';
export const DecryptionFailed = 'Failed to decrypt request body';
export const EmailRequired = 'Email is required';
export const TooManyOTPRequest = 'Too many OTP requests.';
export const EmailVerification = 'Your Email Verification Code';
export const OTPExpired = 'OTP has expired. Please request a new one.';
export const InvalidOTP = 'Invalid OTP. Please try again.';
export const OTPSentSuccessfully = 'OTP has been sent successfully';
export const OTPVerifiedSuccessfully = 'OTP has been verified successfully';
export const TempTokenExpired = 'Temporary token has expired. Please login again.';
export const ResetPasswordSubject = 'Password Reset Request';
export const PwdResetLinkExpiry = 30; // minutes
export const ResetPasswordLinkMsg = 'Reset password link has been sent to the specified email';
export const PasswordResetLinkAlreadyUsed = 'Password reset link has been utilized previously';
export const PasswordResetTokenIsExpire = 'Password reset link has been expire';
export const OldPasswordIncorrect = 'Please enter correct old password';
export const OldPasswordSameAsNew = 'New password must be different from old password';
export const DeviceTokenUpdatedSuccessfully = 'Device token has been updated successfully';

// User Messages
export const UserCreatedSuccessfully = 'User has been created successfully';
export const UserUpdatedSuccessfully = 'User has been updated successfully';
export const UserDeletedSuccessfully = 'User has been deleted successfully';
export const UserDoesNotExist = 'User does not exist';
export const EmailAlreadyExist = 'User with this email already exists';
export const UserInfo = 'User info';
export const UsersInfo = 'Users info';
export const RequireUserId = 'User id is required';

// Password Messages
export const PasswordResetTokenSent = 'Password reset token has been sent to your email';
export const PasswordResetSuccessfully = 'Password has been reset successfully';
export const NewPasswordSameAsCurrentPassword = 'New password cannot be same as current password';
export const PasswordChangedSuccessfully = 'Password has been changed successfully';
export const InvalidPasswordResetToken = 'Invalid or expired password reset token';
export const PasswordRequired = 'Password is required';

// OTP Messages
export const OtpSentSuccessfully = 'OTP has been sent successfully';
export const OtpVerifiedSuccessfully = 'OTP has been verified successfully';
export const InvalidOtp = 'Invalid or expired OTP';
export const OtpRequired = 'OTP is required';

// Device Messages
export const DeviceRegisteredSuccessfully = 'Device has been registered successfully';
export const DeviceUpdatedSuccessfully = 'Device has been updated successfully';
export const InvalidDevice = 'Invalid device information';

// General Messages
export const SomethingWentWrong = 'Something went wrong';
export const InvalidRequest = 'Invalid request';
export const RequiredFieldsMissing = 'Required fields are missing';
export const OperationSuccessful = 'Operation completed successfully';
export const OperationFailed = 'Operation failed';
export const ErrorWhileEncryptionDecryption = 'Error occurred during encryption/decryption';
export const InvalidAPIKey = 'Invalid or missing API key';
