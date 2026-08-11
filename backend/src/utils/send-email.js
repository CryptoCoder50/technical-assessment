const { Resend } = require("resend");
const { env } = require("../config");
const { ApiError } = require("./api-error");

const sendMail = async (mailOptions) => {
    if (!env.RESEND_API_KEY || env.RESEND_API_KEY === "re_your_resend_api_key_here") {
        throw new ApiError(500, "Email service is not configured");
    }

    const resend = new Resend(env.RESEND_API_KEY);

    const { error } = await resend.emails.send(mailOptions);

    if (error) {
        throw new ApiError(500, "Unable to send email");
    }
};

module.exports = {
    sendMail,
};