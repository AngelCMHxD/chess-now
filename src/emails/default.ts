import ActivationEmail from "./activation";
import PasswordChangedEmail from "./password-changed";
import PasswordResetEmail from "./password-reset";
import WelcomeEmail from "./welcome";

export const Emails = {
	Welcome: WelcomeEmail,
	PasswordChanged: PasswordChangedEmail,
	PasswordReset: PasswordResetEmail,
	Activation: ActivationEmail,
};
