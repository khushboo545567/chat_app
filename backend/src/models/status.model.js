import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      enum: ["text", "image", "video"],
      default: "text",
    },
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    expireDate: { type: Date, required: true },
  },
  { timestamps: true },
);
statusSchema.index({ expireDate: 1 }, { expireAfterSeconds: 0 });

export const Status = mongoose.model("Status", statusSchema);
