import twilio from "twilio";
import { ApiError } from "../utils/apiError.js";

const accountId = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICE_SID;

const client = twilio(accountId, authToken);

// send OTP to phone number
const sendOtpToPhoneNumber = async (phoneNumber) => {
  try {
    if (!phoneNumber) {
      throw new ApiError(400, "Phone number is required");
    }
    const response = await client.verify.v2
      .services(serviceId)
      .verifications.create({ to: phoneNumber, channel: "sms" });
    console.log("SMS sent response:", response);
    return response;
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw new ApiError(500, "Failed to send SMS");
  }
};

// verify OTP
const verifySms = async (phoneNumber, otp) => {
  try {
    if (!phoneNumber || !otp) {
      throw new ApiError(400, "Phone number and OTP are required");
    }

    const response = await client.verify.v2
      .services(serviceId)
      .verificationChecks.create({ to: phoneNumber, code: otp });
    console.log("SMS verification response:", response);
    return response;
  } catch (error) {
    console.error("Error verifying SMS:", error);
    throw new ApiError(500, "Failed to verify SMS");
  }
};

export { verifySms, sendOtpToPhoneNumber };
