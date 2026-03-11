import mongoose, { Schema, Document, Model } from "mongoose"

export type MessageType   = "support" | "cancel_request" | "return_request" | "replacement_request"
export type MessageStatus = "new" | "read" | "in_progress" | "resolved" | "closed"

export interface TicketComment {
  from:       "customer" | "admin"
  authorName: string
  text:       string
  createdAt:  Date
}

export interface MessageDocument extends Document {
  ticketId:      string
  type:          MessageType
  status:        MessageStatus
  subject:       string
  message:       string
  customerName:  string
  customerEmail: string
  orderId?:      string
  adminReply?:   string   // kept for backward compat
  repliedAt?:    Date
  comments:      TicketComment[]
}

function genTicketId() {
  const d   = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`
  const rnd = Math.random().toString(36).toUpperCase().slice(2,8)
  return `MSG-${ymd}-${rnd}`
}

const CommentSchema = new Schema<TicketComment>({
  from:       { type: String, enum: ["customer","admin"], required: true },
  authorName: { type: String, required: true },
  text:       { type: String, required: true },
  createdAt:  { type: Date, default: () => new Date() },
}, { _id: true })

const MessageSchema = new Schema<MessageDocument>({
  ticketId:      { type: String, default: genTicketId, unique: true },
  type:          { type: String, enum: ["support","cancel_request","return_request","replacement_request"], required: true },
  status:        { type: String, enum: ["new","read","in_progress","resolved","closed"], default: "new" },
  subject:       { type: String, required: true },
  message:       { type: String, required: true },
  customerName:  { type: String, required: true },
  customerEmail: { type: String, required: true, lowercase: true },
  orderId:       { type: String, default: "" },
  adminReply:    { type: String, default: "" },
  repliedAt:     { type: Date },
  comments:      { type: [CommentSchema], default: [] },
}, { timestamps: true })

MessageSchema.index({ customerEmail: 1 })
MessageSchema.index({ ticketId: 1 })
MessageSchema.index({ status: 1 })
MessageSchema.index({ type: 1 })
MessageSchema.index({ createdAt: -1 })

const Message: Model<MessageDocument> = mongoose.models.Message || mongoose.model("Message", MessageSchema)
export default Message
