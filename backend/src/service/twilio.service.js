import twilio from "twilio";
import { ApiError } from "../utils/apiError";

const accountId = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICE_SID;

const client = twilio(accountId, authToken);

// send otp to phone number
const sendOtpToPhoneNumber = async (phoneNumber) => {
  try {
    console.log(phoneNumber, "this is the phone number send to the sms");
    if (!phoneNumber) {
      throw new ApiError(400, "Phone number is required");
    }
    const response = await client.verify.v2
      .services(serviceId)
      .verifications.create({ to: phoneNumber, channel: "sms" });
    console.log("here the respnse of the sms", response);
    return response;
  } catch (error) {
    console.log(error);
    throw new ApiError("failed to send sms");
  }
};

const verifySms = async (phoneNumber, otp) => {
  try {
    console.log("this is otp of sms", otp);
    const response = await client.verify.v2
      .services(serviceId)
      .verificationChecks.create({ to: phoneNumber, code: otp });
    console.log("here the respnse of the sms", response);
    return response;
  } catch (error) {
    console.log(error);
    throw new ApiError("failed to send sms");
  }
};

export { verifySms, sendOtpToPhoneNumber };
