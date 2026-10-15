import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "dist")));
app.use(express.static(path.join(__dirname, "public")));

const adminSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true }
}, { collection: "admins", timestamps: true });

const memberSchema = new mongoose.Schema({
  vn_number: { type: String, unique: true, required: true, index: true, trim: true },
  name: { type: String, required: true, trim: true },
  surname: { type: String, required: true, trim: true },
  phone: { type: String, unique: true, required: true, index: true, trim: true },
  password: { type: String, default: "1234" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  join_date: { type: Date, default: Date.now }
}, { collection: "members" });

const dependentSchema = new mongoose.Schema({
  member_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  surname: {
    type: String,
    required: true,
    trim: true
  },
  relationship: {
    type: String,
    enum: ["Wife", "Child"],
    required: true
  },
  date_of_birth: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active"
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, { collection: "dependents" });

const Dependent = mongoose.model("Dependent", dependentSchema);

function isChildAgeValid(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  const cutoff = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return dob >= cutoff && dob <= today;
}

const funeralSchema = new mongoose.Schema({
  deceased_name: { type: String, required: true, trim: true },
  funeral_date: { type: Date, required: true },
  contribution_amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["Open", "Closed"], default: "Open" },
  created_at: { type: Date, default: Date.now }
}, { collection: "funerals" });

const paymentSchema = new mongoose.Schema({
  funeral_id: { type: mongoose.Schema.Types.ObjectId, ref: "Funeral", required: true, index: true },
  funeral_deceased_name: { type: String, required: true },
  funeral_date: { type: Date, required: true },
  contribution_amount: { type: Number, required: true },
  member_id: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
  vn_number: { type: String, required: true, index: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ["PAID", "NOT PAID"], default: "NOT PAID", index: true },
  payment_date: { type: Date, default: null },
  amount_paid: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
}, { collection: "funeral_payments" });

paymentSchema.index({ funeral_id: 1, vn_number: 1 });
paymentSchema.index({ funeral_id: 1, status: 1 });
paymentSchema.index({ vn_number: 1 });

const Admin = mongoose.model("Admin", adminSchema);
const Member = mongoose.model("Member", memberSchema);
const helperSchema = new mongoose.Schema({
  member_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
    unique: true
  },
  vn_number: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  surname: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active"
  }
}, {
  collection: "helpers",
  timestamps: true
});

const Helper = mongoose.model("Helper", helperSchema);
const paymentChangeRequestSchema = new mongoose.Schema({
  payment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FuneralPayment",
    required: true,
    index: true
  },

  funeral_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Funeral",
    required: true,
    index: true
  },

  member_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true
  },

  vn_number: {
    type: String,
    required: true,
    index: true,
    trim: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  surname: {
    type: String,
    required: true,
    trim: true
  },

  old_status: {
    type: String,
    enum: ["PAID", "NOT PAID"],
    required: true
  },

  new_status: {
    type: String,
    enum: ["PAID", "NOT PAID"],
    required: true
  },

  helper_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Helper",
    required: true
  },

  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING",
    index: true
  },

  submitted_at: {
    type: Date,
    default: Date.now
  },

  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null
  },

  approved_at: {
    type: Date,
    default: null
  }
}, {
  collection: "payment_change_requests"
});

const PaymentChangeRequest =
  mongoose.model(
    "PaymentChangeRequest",
    paymentChangeRequestSchema
  );
const Funeral = mongoose.model("Funeral", funeralSchema);
const FuneralPayment = mongoose.model("FuneralPayment", paymentSchema);

// ============================================================
// SERVER-SIDE AUTHENTICATION SESSIONS
// ============================================================
const sessionSchema = new mongoose.Schema({
  token_hash: { type: String, required: true, unique: true, index: true },
  role: { type: String, enum: ["admin", "helper", "member"], required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  vn_number: { type: String, default: null },
  expires_at: { type: Date, required: true, index: true }
}, { collection: "sessions", timestamps: true });

const Session = mongoose.model("Session", sessionSchema);
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getCookie(req, name) {
  const header = req.get("cookie") || "";
  const parts = header.split(";").map(part => part.trim());
  const prefix = name + "=";
  const found = parts.find(part => part.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : null;
}

async function createSession({ role, userId, vnNumber = null }) {
  const token = crypto.randomBytes(32).toString("hex");
  await Session.create({
    token_hash: hashSessionToken(token),
    role,
    user_id: userId,
    vn_number: vnNumber,
    expires_at: new Date(Date.now() + SESSION_TTL_MS)
  });
  return token;
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `session_token=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`
  );
}

async function requireAuth(req, res, next) {
  try {
    const token = getCookie(req, "session_token");
    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const session = await Session.findOne({
      token_hash: hashSessionToken(token),
      expires_at: { $gt: new Date() }
    }).lean();

    if (!session) {
      return res.status(401).json({ message: "Your session has expired. Please log in again." });
    }

    req.auth = session;
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    res.status(401).json({ message: "Authentication failed." });
  }
}

function requireRole(...roles) {
  return [requireAuth, (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action." });
    }
    next();
  }];
}

const visitSchema = new mongoose.Schema({
  page: {
    type: String,
    default: "/"
  },
  user_agent: {
    type: String,
    default: ""
  },
  referrer: {
    type: String,
    default: ""
  },
  visited_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { collection: "website_visits" });

const WebsiteVisit = mongoose.model("WebsiteVisit", visitSchema);

// ============================================================
// SYNC CURRENT MEMBERS INTO AN EXISTING FUNERAL
// ============================================================
// Adds only members who do not yet have a payment record for
// this funeral. Existing PAID / NOT PAID records are untouched.
// ============================================================

async function syncFuneralMembers(funeral) {
  const activeMembers = await Member.find({ status: "Active" })
    .select("_id vn_number name surname phone")
    .lean();

  if (!activeMembers.length) {
    return 0;
  }

  const existingPayments = await FuneralPayment.find({
    funeral_id: funeral._id
  })
    .select("member_id")
    .lean();

  const existingMemberIds = new Set(
    existingPayments.map(payment => String(payment.member_id))
  );

  const missingMembers = activeMembers.filter(
    member => !existingMemberIds.has(String(member._id))
  );

  if (!missingMembers.length) {
    return 0;
  }

  const operations = missingMembers.map(member => ({
    updateOne: {
      filter: {
        funeral_id: funeral._id,
        member_id: member._id
      },
      update: {
        $setOnInsert: {
          funeral_id: funeral._id,
          funeral_deceased_name: funeral.deceased_name,
          funeral_date: funeral.funeral_date,
          contribution_amount: funeral.contribution_amount,
          member_id: member._id,
          vn_number: member.vn_number,
          name: member.name,
          surname: member.surname,
          phone: member.phone,
          status: "NOT PAID",
          payment_date: null,
          amount_paid: 0,
          created_at: new Date()
        }
      },
      upsert: true
    }
  }));

  const result = await FuneralPayment.bulkWrite(operations, {
    ordered: false
  });

  return result.upsertedCount || 0;
}

function publicMember(member) {
  return {
    member_id: member._id,
    vn_number: member.vn_number,
    name: member.name,
    surname: member.surname,
    phone: member.phone,
    status: member.status,
    join_date: member.join_date
  };
}

app.post("/api/visits", async (req, res) => {
  try {
    await WebsiteVisit.create({
      page: String(req.body.page || "/").slice(0, 200),
      user_agent: String(req.get("user-agent") || "").slice(0, 500),
      referrer: String(req.get("referer") || "").slice(0, 500)
    });

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Visitor tracking error:", err);
    res.status(500).json({ success: false });
  }
});

app.get("/api/visits/stats", ...requireRole("admin"), async (req, res) => {
  try {
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [today, thisWeek, thisMonth, total] = await Promise.all([
      WebsiteVisit.countDocuments({
        visited_at: { $gte: startOfDay }
      }),

      WebsiteVisit.countDocuments({
        visited_at: { $gte: startOfWeek }
      }),

      WebsiteVisit.countDocuments({
        visited_at: { $gte: startOfMonth }
      }),

      WebsiteVisit.countDocuments()
    ]);

    res.json({
      today,
      thisWeek,
      thisMonth,
      total
    });

  } catch (err) {
    console.error("Visitor statistics error:", err);
    res.status(500).json({
      message: "Could not load visitor statistics."
    });
  }
});

app.get("/api/health", async (req, res) => {
  res.json({ ok: true, database: mongoose.connection.readyState === 1 });
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password, vn_number, phone, full_name, helper_password } = req.body;
    

    if (email && password) {
      const admin = await Admin.findOne({ email: String(email).toLowerCase().trim() });
      if (!admin || !(await bcrypt.compare(String(password), admin.password))) {
        return res.status(401).json({ message: "Invalid admin email or password." });
      }
      const token = await createSession({ role: "admin", userId: admin._id });
      setSessionCookie(res, token);
      return res.json({
        role: "admin",
        admin: { name: admin.name, email: admin.email }
      });
    }

    // Helper login: existing member VN + full name + shared helper password
if (vn_number && full_name && helper_password) {
  const member = await Member.findOne({
    vn_number: String(vn_number).trim()
  });

  if (!member) {
    return res.status(401).json({
      message: "Invalid VN Number or full name."
    });
  }

  const submittedName = String(full_name)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

  const memberName = `${member.name} ${member.surname}`
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

  if (submittedName !== memberName) {
    return res.status(401).json({
      message: "Invalid VN Number or full name."
    });
  }

  if (String(helper_password) !== String(process.env.HELPER_PASSWORD || "")) {
    return res.status(401).json({
      message: "Invalid helper password."
    });
  }

  if (member.status !== "Active") {
    return res.status(403).json({
      message: "This member account is inactive."
    });
  }

  let helper = await Helper.findOne({
    member_id: member._id
  });

  if (!helper) {
    helper = await Helper.create({
      member_id: member._id,
      vn_number: member.vn_number,
      name: member.name,
      surname: member.surname,
      status: "Active"
    });
  }

  if (helper.status !== "Active") {
    return res.status(403).json({
      message: "This helper account is inactive."
    });
  }

  const token = await createSession({
    role: "helper",
    userId: helper._id,
    vnNumber: member.vn_number
  });
  setSessionCookie(res, token);
  return res.json({
    role: "helper",
    helper: {
      helper_id: helper._id,
      member_id: member._id,
      vn_number: member.vn_number,
      name: member.name,
      surname: member.surname
    }
  });
}

    if (vn_number && req.body.full_name) {
  const fullName = String(req.body.full_name)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

  const member = await Member.findOne({
    vn_number: String(vn_number).trim()
  });

  if (!member) {
    return res.status(401).json({ message: "Invalid VN Number or full name." });
  }

  const memberFullName = `${member.name} ${member.surname}`
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

  if (memberFullName !== fullName) {
    return res.status(401).json({ message: "Invalid VN Number or full name." });
  }

  const token = await createSession({
    role: "member",
    userId: member._id,
    vnNumber: member.vn_number
  });
  setSessionCookie(res, token);
  return res.json({
    role: "member",
    member: publicMember(member)
  });
}

return res.status(400).json({
  message: "Provide admin email/password or member VN/full name."
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed." });
  }
});

app.post("/api/logout", async (req, res) => {
  try {
    const token = getCookie(req, "session_token");
    if (token) {
      await Session.deleteOne({ token_hash: hashSessionToken(token) });
    }
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader(
      "Set-Cookie",
      `session_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Could not log out." });
  }
});

app.get("/api/members", ...requireRole("admin"), async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "50", 10), 1), 50);
    const search = String(req.query.search || "").trim();
    const query = search
      ? {
          $or: [
            { vn_number: { $regex: search, $options: "i" } },
            { name: { $regex: search, $options: "i" } },
            { surname: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    const [members, total] = await Promise.all([
      Member.find(query).sort({ vn_number: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Member.countDocuments(query)
    ]);

    res.json({ members, page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load members." });
  }
});

app.post("/api/members", ...requireRole("admin"), async (req, res) => {
  try {
    const { vn_number, name, surname, phone, password, status, join_date } = req.body;
    if (!vn_number || !name || !surname || !phone) {
      return res.status(400).json({ message: "VN Number, name, surname and phone are required." });
    }
    const member = await Member.create({
      vn_number: String(vn_number).trim(),
      name: String(name).trim(),
      surname: String(surname).trim(),
      phone: String(phone).trim(),
      password: password ? String(password) : "1234",
      status: status === "Inactive" ? "Inactive" : "Active",
      join_date: join_date ? new Date(join_date) : new Date()
    });
    res.status(201).json({ member });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.code === 11000 ? "VN Number or phone already exists." : "Could not add member." });
  }
});

app.get("/api/members/:id", ...requireRole("admin"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid member ID." });
    }

    const member = await Member.findById(req.params.id).lean();

    if (!member) {
      return res.status(404).json({ message: "Member not found." });
    }

    res.json({ member });
  } catch (err) {
    console.error("Get member error:", err);
    res.status(500).json({ message: "Could not load member." });
  }
});

app.delete("/api/members/:id", ...requireRole("admin"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid member ID." });
    }

    const member = await Member.findById(req.params.id).lean();
    if (!member) {
      return res.status(404).json({ message: "Member not found." });
    }

    await Dependent.deleteMany({ member_id: member._id });
    await Member.findByIdAndDelete(member._id);

    res.json({ message: "Member and their dependants deleted." });
  } catch (err) {
    console.error("Delete member error:", err);
    res.status(400).json({ message: "Could not delete member." });
  }
});

app.put("/api/members/:id", ...requireRole("admin"), async (req, res) => {
  try {
    const memberId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: "Invalid member ID." });
    }

    const member = await Member.findById(memberId);

    if (!member) {
      return res.status(404).json({ message: "Member not found." });
    }

    const {
      name,
      surname,
      phone,
      status,
      join_date
    } = req.body;

    if (!name || !surname || !phone) {
      return res.status(400).json({
        message: "Name, surname and phone are required."
      });
    }

    const cleanName = String(name).trim();
    const cleanSurname = String(surname).trim();
    const cleanPhone = String(phone).trim();

    // Prevent the phone number from belonging to another member.
    const phoneOwner = await Member.findOne({
      phone: cleanPhone,
      _id: { $ne: member._id }
    }).select("_id vn_number");

    if (phoneOwner) {
      return res.status(409).json({
        message: `Phone number already belongs to ${phoneOwner.vn_number}.`
      });
    }

    const cleanStatus =
      status === "Inactive" ? "Inactive" : "Active";

    let cleanJoinDate = member.join_date;

    if (join_date) {
      const parsedDate = new Date(join_date);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: "Invalid join date."
        });
      }

      cleanJoinDate = parsedDate;
    }

    // IMPORTANT:
    // VN number is intentionally NOT editable because it is the
    // primary identifier used throughout the system.
    member.name = cleanName;
    member.surname = cleanSurname;
    member.phone = cleanPhone;
    member.status = cleanStatus;
    member.join_date = cleanJoinDate;

    await member.save();

    // Keep the denormalized member information in funeral_payments
    // synchronized.
    const paymentUpdate = await FuneralPayment.updateMany(
      { member_id: member._id },
      {
        $set: {
          vn_number: member.vn_number,
          name: member.name,
          surname: member.surname,
          phone: member.phone
        }
      }
    );

    res.json({
      message: "Member updated successfully.",
      member: publicMember(member),
      payments_updated: paymentUpdate.modifiedCount
    });

  } catch (err) {
    console.error("Edit member error:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        message: "That phone number is already in use."
      });
    }

    res.status(500).json({
      message: "Could not update member."
    });
  }
});

app.get("/api/funerals", ...requireRole("admin", "helper"), async (req, res) => {
  try {
    const funerals = await Funeral.find().sort({ funeral_date: -1, created_at: -1 }).lean();
    res.json({ funerals });
  } catch (err) {
    res.status(500).json({ message: "Could not load funerals." });
  }
});

app.put("/api/funerals/:id", ...requireRole("admin"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid funeral ID." });
    }

    const funeral = await Funeral.findById(req.params.id);
    if (!funeral) return res.status(404).json({ message: "Funeral not found." });

    const deceased_name = String(req.body.deceased_name || "").trim();
    const funeral_date = req.body.funeral_date;
    const contribution_amount = Number(req.body.contribution_amount);

    if (!deceased_name || !funeral_date || !Number.isFinite(contribution_amount) || contribution_amount < 0) {
      return res.status(400).json({ message: "Deceased name, funeral date and valid amount are required." });
    }

    const parsedDate = new Date(funeral_date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid funeral date." });
    }

    funeral.deceased_name = deceased_name;
    funeral.funeral_date = parsedDate;
    funeral.contribution_amount = contribution_amount;
    await funeral.save();

    // Keep denormalized funeral details synchronized in all payment records.
    const paymentUpdate = await FuneralPayment.updateMany(
      { funeral_id: funeral._id },
      [
        {
          $set: {
            funeral_deceased_name: funeral.deceased_name,
            funeral_date: funeral.funeral_date,
            contribution_amount: funeral.contribution_amount,
            amount_paid: {
              $cond: [
                { $eq: ["$status", "PAID"] },
                funeral.contribution_amount,
                "$amount_paid"
              ]
            }
          }
        }
      ]
    );

    res.json({
      message: "Funeral updated successfully.",
      funeral,
      payments_updated: paymentUpdate.modifiedCount
    });
  } catch (err) {
    console.error("Edit funeral error:", err);
    res.status(500).json({ message: "Could not update funeral." });
  }
});

app.put("/api/funerals/:id/close", ...requireRole("admin"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid funeral ID." });
    }

    const funeral = await Funeral.findById(req.params.id);
    if (!funeral) {
      return res.status(404).json({ message: "Funeral not found." });
    }

    if (funeral.status === "Closed") {
      return res.json({
        message: "Funeral is already closed.",
        funeral
      });
    }

    funeral.status = "Closed";
    await funeral.save();

    res.json({
      message: "Funeral closed successfully.",
      funeral
    });
  } catch (err) {
    console.error("Close funeral error:", err);
    res.status(500).json({ message: "Could not close funeral." });
  }
});

app.delete("/api/funerals/:id", ...requireRole("admin"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid funeral ID." });
    }

    const funeral = await Funeral.findById(req.params.id).lean();
    if (!funeral) return res.status(404).json({ message: "Funeral not found." });

    // Delete the payment records belonging only to this funeral, then the funeral itself.
    const paymentDelete = await FuneralPayment.deleteMany({ funeral_id: funeral._id });
    await Funeral.findByIdAndDelete(funeral._id);

    res.json({
      message: "Funeral and its payment records deleted.",
      payments_deleted: paymentDelete.deletedCount
    });
  } catch (err) {
    console.error("Delete funeral error:", err);
    res.status(500).json({ message: "Could not delete funeral." });
  }
});

app.post("/api/funerals", ...requireRole("admin"), async (req, res) => {
  try {
    const deceased_name = String(req.body.deceased_name || "").trim();
    const funeral_date = req.body.funeral_date;
    const contribution_amount = Number(req.body.contribution_amount);

    if (!deceased_name || !funeral_date || !Number.isFinite(contribution_amount) || contribution_amount < 0) {
      return res.status(400).json({ message: "Deceased name, funeral date and valid amount are required." });
    }

    const funeral = await Funeral.create({
      deceased_name,
      funeral_date: new Date(funeral_date),
      contribution_amount,
      status: "Open"
    });

    const activeMembers = await Member.find({ status: "Active" })
      .select("_id vn_number name surname phone")
      .lean();

    const payments = activeMembers.map(member => ({
      funeral_id: funeral._id,
      funeral_deceased_name: funeral.deceased_name,
      funeral_date: funeral.funeral_date,
      contribution_amount: funeral.contribution_amount,
      member_id: member._id,
      vn_number: member.vn_number,
      name: member.name,
      surname: member.surname,
      phone: member.phone,
      status: "NOT PAID",
      payment_date: null,
      amount_paid: 0,
      created_at: new Date()
    }));

    if (payments.length) await FuneralPayment.insertMany(payments, { ordered: false });

    res.status(201).json({
      funeral,
      payments_created: payments.length
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Could not create funeral.", error: err.message });
  }
});

app.get("/api/payments/:funeralId", ...requireRole("admin", "helper"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.funeralId)) {
      return res.status(400).json({
        message: "Invalid funeral ID."
      });
    }

    const funeralId = new mongoose.Types.ObjectId(req.params.funeralId);

    const funeral = await Funeral.findById(funeralId).lean();

    if (!funeral) {
      return res.status(404).json({
        message: "Funeral not found."
      });
    }

    // IMPORTANT:
    // Make sure all current active members exist on this funeral
    // before loading the payment list.
    //
    // Existing payment records are NOT changed.
    // Only missing members are added as NOT PAID.
    const membersAdded = await syncFuneralMembers(funeral);

    const status = req.query.status;
    const search = String(req.query.search || "").trim();

    const query = {
      funeral_id: funeralId
    };

    if (status === "PAID" || status === "NOT PAID") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { vn_number: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { surname: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    const payments = await FuneralPayment.find(query)
      .sort({ vn_number: 1 })
      .lean();

    const allForSummary = await FuneralPayment.find({
      funeral_id: funeralId
    })
      .select("status amount_paid contribution_amount")
      .lean();

    const paid = allForSummary.filter(
      payment => payment.status === "PAID"
    );

    const collected = paid.reduce(
      (sum, payment) => sum + Number(payment.amount_paid || 0),
      0
    );

    res.json({
      payments,
      summary: {
        total: allForSummary.length,
        paid: paid.length,
        notPaid: allForSummary.length - paid.length,
        collected
      },
      members_added: membersAdded
    });

  } catch (err) {
    console.error("Load funeral payments error:", err);

    res.status(400).json({
      message: "Invalid funeral ID or could not load payments."
    });
  }
});

    

app.put("/api/payments/:id/toggle", ...requireRole("admin"), async (req, res) => {
  try {
    const payment = await FuneralPayment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found."
      });
    }

    // Do not allow payment marking when the funeral is closed.
    const funeral = await Funeral.findById(payment.funeral_id)
      .select("status");

    if (!funeral) {
      return res.status(404).json({
        message: "Funeral not found."
      });
    }

    if (funeral.status === "Closed") {
      return res.status(403).json({
        message: "This funeral is closed. Payment marking is disabled."
      });
    }

    if (payment.status === "PAID") {
      payment.status = "NOT PAID";
      payment.payment_date = null;
      payment.amount_paid = 0;
    } else {
      payment.status = "PAID";
      payment.payment_date = new Date();
      payment.amount_paid = Number(payment.contribution_amount || 0);
    }

    await payment.save();

    res.json({ payment });

  } catch (err) {
    console.error("Toggle payment error:", err);

    res.status(400).json({
      message: "Could not toggle payment."
    });
  }
});

app.post("/api/payment-change-requests", ...requireRole("helper"), async (req, res) => {
  try {
    const {
      payment_id,
      new_status
    } = req.body;
    const helper_id = req.auth.user_id;

    if (!payment_id || !new_status) {
      return res.status(400).json({
        message: "Payment, status and helper are required."
      });
    }

    if (!["PAID", "NOT PAID"].includes(new_status)) {
      return res.status(400).json({
        message: "Invalid payment status."
      });
    }

    const helper = await Helper.findById(helper_id);

    if (!helper || helper.status !== "Active") {
      return res.status(403).json({
        message: "Helper account is not active."
      });
    }

    const payment =
      await FuneralPayment.findById(payment_id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment record not found."
      });
    }

        // Do not allow helpers to submit payment changes
    // when the funeral is closed.
    const funeral = await Funeral.findById(payment.funeral_id)
      .select("status");

    if (!funeral) {
      return res.status(404).json({
        message: "Funeral not found."
      });
    }

    if (funeral.status === "Closed") {
      return res.status(403).json({
        message: "This funeral is closed. Payment marking is disabled."
      });
    }

    // Prevent unnecessary changes
    if (payment.status === new_status) {
      return res.status(400).json({
        message: `Payment is already ${new_status}.`
      });
    }

    // Do not allow multiple pending requests
    const existing =
      await PaymentChangeRequest.findOne({
        payment_id: payment._id,
        status: "PENDING"
      });

    if (existing) {
      return res.status(409).json({
        message:
          "This payment already has a pending change awaiting admin approval."
      });
    }

    const request =
      await PaymentChangeRequest.create({
        payment_id: payment._id,
        funeral_id: payment.funeral_id,
        member_id: payment.member_id,
        vn_number: payment.vn_number,
        name: payment.name,
        surname: payment.surname,
        old_status: payment.status,
        new_status,
        helper_id: helper._id,
        status: "PENDING"
      });

    res.status(201).json({
      message:
        "Payment change submitted for admin approval.",
      request
    });

  } catch (err) {
    console.error(err);

    res.status(400).json({
      message:
        "Could not submit payment change.",
      error: err.message
    });
  }
});

// ============================================================
// ADMIN - PENDING HELPER PAYMENT CHANGE REQUESTS
// ============================================================

app.get("/api/payment-change-requests", ...requireRole("admin"), async (req, res) => {
  try {
    const requests = await PaymentChangeRequest.find({
      status: "PENDING"
    })
      .populate("helper_id", "vn_number name surname")
      .populate("funeral_id", "deceased_name funeral_date contribution_amount")
      .sort({ submitted_at: 1 })
      .lean();

    res.json({
      requests,
      count: requests.length
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Could not load pending helper approvals."
    });
  }
});


// ============================================================
// ADMIN - APPROVE HELPER PAYMENT CHANGE
// ============================================================

app.put("/api/payment-change-requests/:id/approve", ...requireRole("admin"), async (req, res) => {
  try {
    const request =
      await PaymentChangeRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Approval request not found."
      });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        message:
          `This request has already been ${request.status.toLowerCase()}.`
      });
    }

    const payment =
      await FuneralPayment.findById(request.payment_id);

    if (!payment) {
      return res.status(404).json({
        message: "Original payment record no longer exists."
      });
    }

    // Make sure the payment has not changed since
    // the helper submitted the request.
    if (payment.status !== request.old_status) {
      request.status = "REJECTED";
      request.approved_at = new Date();
      await request.save();

      return res.status(409).json({
        message:
          "The payment changed after the helper submitted the request. The request was rejected for safety."
      });
    }

    // Apply the requested status
    payment.status = request.new_status;

    if (request.new_status === "PAID") {
      payment.payment_date = new Date();
      payment.amount_paid =
        Number(payment.contribution_amount || 0);
    } else {
      payment.payment_date = null;
      payment.amount_paid = 0;
    }

    await payment.save();

    // Mark request as approved
    request.status = "APPROVED";
    request.approved_at = new Date();

    await request.save();

    res.json({
      message: "Payment change approved successfully.",
      payment,
      request
    });

  } catch (err) {
    console.error(err);

    res.status(400).json({
      message: "Could not approve payment change.",
      error: err.message
    });
  }
});


// ============================================================
// ADMIN - REJECT HELPER PAYMENT CHANGE
// ============================================================

app.put("/api/payment-change-requests/:id/reject", ...requireRole("admin"), async (req, res) => {
  try {
    const request =
      await PaymentChangeRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Approval request not found."
      });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        message:
          `This request has already been ${request.status.toLowerCase()}.`
      });
    }

    request.status = "REJECTED";
    request.approved_at = new Date();

    await request.save();

    res.json({
      message: "Payment change rejected.",
      request
    });

  } catch (err) {
    console.error(err);

    res.status(400).json({
      message: "Could not reject payment change.",
      error: err.message
    });
  }
});



// ============================================================
// DEPENDANTS MANAGEMENT
// Dependants belong to one member and can be a Wife or Child.
// Only admins can add/edit/delete dependants.
// Members can view their own dependants through /api/member-payments/:vn.
// ============================================================

app.get("/api/members/:id/dependents", ...requireRole("admin"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid member ID." });
    }

    const member = await Member.findById(req.params.id).select("_id vn_number name surname status").lean();
    if (!member) {
      return res.status(404).json({ message: "Member not found." });
    }

    const dependents = await Dependent.find({ member_id: member._id })
      .sort({ relationship: 1, name: 1, surname: 1 })
      .lean();

    res.json({ member, dependents });
  } catch (err) {
    console.error("Load dependants error:", err);
    res.status(500).json({ message: "Could not load dependants." });
  }
});

app.post("/api/members/:id/dependents", ...requireRole("admin"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid member ID." });
    }

    const member = await Member.findById(req.params.id).select("_id vn_number name surname").lean();
    if (!member) {
      return res.status(404).json({ message: "Member not found." });
    }

    const name = String(req.body.name || "").trim();
    const surname = String(req.body.surname || "").trim();
    const relationship = String(req.body.relationship || "").trim();
    const dateOfBirth = req.body.date_of_birth;
    const status = req.body.status === "Inactive" ? "Inactive" : "Active";

    if (!name || !surname || !["Wife", "Child"].includes(relationship) || !dateOfBirth) {
      return res.status(400).json({
        message: "Name, surname, relationship and date of birth are required."
      });
    }

    const parsedDate = new Date(dateOfBirth);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date of birth." });
    }

    if (parsedDate > new Date()) {
      return res.status(400).json({ message: "Date of birth cannot be in the future." });
    }

    if (relationship === "Child" && !isChildAgeValid(parsedDate)) {
      return res.status(400).json({
        message: "Children registered as dependants must be 18 years old or younger."
      });
    }

    const dependent = await Dependent.create({
      member_id: member._id,
      name,
      surname,
      relationship,
      date_of_birth: parsedDate,
      status
    });

    res.status(201).json({ message: "Dependant added successfully.", dependent });
  } catch (err) {
    console.error("Add dependant error:", err);
    res.status(400).json({ message: "Could not add dependant." });
  }
});

app.put("/api/dependents/:id", ...requireRole("admin"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid dependant ID." });
    }

    const dependent = await Dependent.findById(req.params.id);
    if (!dependent) {
      return res.status(404).json({ message: "Dependant not found." });
    }

    const name = String(req.body.name || "").trim();
    const surname = String(req.body.surname || "").trim();
    const relationship = String(req.body.relationship || "").trim();
    const dateOfBirth = req.body.date_of_birth;
    const status = req.body.status === "Inactive" ? "Inactive" : "Active";

    if (!name || !surname || !["Wife", "Child"].includes(relationship) || !dateOfBirth) {
      return res.status(400).json({
        message: "Name, surname, relationship and date of birth are required."
      });
    }

    const parsedDate = new Date(dateOfBirth);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date of birth." });
    }

    if (parsedDate > new Date()) {
      return res.status(400).json({ message: "Date of birth cannot be in the future." });
    }

    if (relationship === "Child" && !isChildAgeValid(parsedDate)) {
      return res.status(400).json({
        message: "Children registered as dependants must be 18 years old or younger."
      });
    }

    dependent.name = name;
    dependent.surname = surname;
    dependent.relationship = relationship;
    dependent.date_of_birth = parsedDate;
    dependent.status = status;

    await dependent.save();

    res.json({ message: "Dependant updated successfully.", dependent });
  } catch (err) {
    console.error("Edit dependant error:", err);
    res.status(400).json({ message: "Could not update dependant." });
  }
});

app.delete("/api/dependents/:id", ...requireRole("admin"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid dependant ID." });
    }

    const deleted = await Dependent.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Dependant not found." });
    }

    res.json({ message: "Dependant deleted successfully." });
  } catch (err) {
    console.error("Delete dependant error:", err);
    res.status(400).json({ message: "Could not delete dependant." });
  }
});

app.get("/api/member-payments/:vn", ...requireRole("member"), async (req, res) => {
  try {
    const vn = String(req.params.vn).trim();
    if (String(req.auth.vn_number) !== vn) {
      return res.status(403).json({ message: "You can only view your own payment records." });
    }
    const member = await Member.findOne({ vn_number: vn }).lean();
    if (!member) return res.status(404).json({ message: "Member not found." });

    const [payments, dependents] = await Promise.all([
      FuneralPayment.find({ vn_number: vn })
        .sort({ funeral_date: -1 })
        .lean(),
      Dependent.find({ member_id: member._id })
        .sort({ relationship: 1, name: 1, surname: 1 })
        .lean()
    ]);

    res.json({ member: publicMember(member), payments, dependents });
  } catch (err) {
    res.status(500).json({ message: "Could not load member payments." });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
