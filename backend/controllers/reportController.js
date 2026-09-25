import Report from "../models/Report.js";
import { notifyMatchingSubscriptions } from "../utils/alertService.js";

// @desc Create a new scam report (with evidence files + auto risk scoring)
export const createReport = async (req, res) => {
  try {
    const body = { ...req.body, reportedBy: req.user._id };
    if (req.body.scamContact) {
      body.scamContact = typeof req.body.scamContact === "string"
        ? JSON.parse(req.body.scamContact)
        : req.body.scamContact;
    }
    if (typeof req.body.location === "string") {
      try {
        body.location = JSON.parse(req.body.location);
      } catch {
        body.location = { text: req.body.location };
      }
    }
    if (req.files?.length) {
      body.evidenceUrls = req.files.map((f) => `/uploads/${f.filename}`);
    }
    body.statusHistory = [{
      status: body.status || "Pending Review",
      changedBy: req.user._id,
      note: "Report submitted",
    }];

    const report = await Report.create(body);
    notifyMatchingSubscriptions(report).catch((error) => {
      console.error(`Alert matching failed: ${error.message}`);
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get all reports (with search, category filter, pagination)
export const getReports = async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate("reportedBy", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Report.countDocuments(query);
    res.json({ reports, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get single report by id, plus linked reports sharing the same scammer contact info
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("reportedBy", "name")
      .populate("statusHistory.changedBy", "name role");
    if (!report) return res.status(404).json({ message: "Report not found" });

    // Find other reports sharing phone / email / website / UPI -> same scammer
    const contact = report.scamContact || {};
    const orConditions = [];
    if (contact.phone) orConditions.push({ "scamContact.phone": contact.phone });
    if (contact.email) orConditions.push({ "scamContact.email": contact.email });
    if (contact.website) orConditions.push({ "scamContact.website": contact.website });
    if (contact.upiId) orConditions.push({ "scamContact.upiId": contact.upiId });

    let linkedReports = [];
    if (orConditions.length) {
      linkedReports = await Report.find({ _id: { $ne: report._id }, $or: orConditions })
        .select("title status createdAt amountLost")
        .limit(10);
    }

    const riskScore = computeRiskScore(report, linkedReports);

    res.json({ report, linkedReports, riskScore });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Simple heuristic risk score (0-100) based on report count, upvotes, amount lost
function computeRiskScore(report, linkedReports) {
  const totalReportsForScammer = linkedReports.length + 1;
  const upvotes = report.upvotes?.length || 0;
  const totalLoss = linkedReports.reduce((sum, r) => sum + (r.amountLost || 0), 0) + (report.amountLost || 0);

  let score = 0;
  score += Math.min(totalReportsForScammer * 15, 45); // repeat reports = strong signal
  score += Math.min(upvotes * 5, 25); // community confirmation
  score += Math.min(Math.floor(totalLoss / 5000), 30); // financial impact

  return Math.min(score, 100);
}

// @desc Update report status (admin/investigator only)
export const updateReportStatus = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    const nextStatus = req.body.status || report.status;
    const note = typeof req.body.adminNote === "string" ? req.body.adminNote.trim() : "";
    if (nextStatus !== report.status) {
      report.statusHistory.push({ status: nextStatus, changedBy: req.user._id, note });
    }
    report.status = nextStatus;
    if (typeof req.body.adminNote === "string") report.adminNote = note;
    await report.save();
    await report.populate("statusHistory.changedBy", "name role");
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Export a report's audit trail for authorized investigators
export const exportAuditTrail = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("statusHistory.changedBy", "name email role");
    if (!report) return res.status(404).json({ message: "Report not found" });

    const rows = [
      ["Field", "Value"],
      ["Report ID", report._id],
      ["Title", report.title],
      ["Category", report.category],
      ["Current status", report.status],
      ["Amount lost", report.amountLost || 0],
      ["Created at", report.createdAt?.toISOString() || ""],
      ["Admin review note", report.adminNote || ""],
      [],
      ["Status", "Changed at", "Changed by", "Role", "Review note"],
      ...report.statusHistory.map((event) => [
        event.status,
        event.changedAt?.toISOString() || "",
        event.changedBy?.name || "Unknown",
        event.changedBy?.role || "",
        event.note || "",
      ]),
    ];

    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="report-${report._id}-audit.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Upvote / confirm a report (helps flag repeat scammers)
export const upvoteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    const alreadyUpvoted = report.upvotes.includes(req.user._id);
    if (alreadyUpvoted) {
      report.upvotes.pull(req.user._id);
    } else {
      report.upvotes.push(req.user._id);
    }
    await report.save();
    res.json({ upvotes: report.upvotes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Delete a report (owner or admin)
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    const isOwner = report.reportedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Not allowed" });

    await report.deleteOne();
    res.json({ message: "Report deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Dashboard stats (counts by category/status)
export const getStats = async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const byCategory = await Report.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const byStatus = await Report.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const totalLoss = await Report.aggregate([
      { $group: { _id: null, total: { $sum: "$amountLost" } } },
    ]);
    res.json({
      totalReports,
      byCategory,
      byStatus,
      totalLoss: totalLoss[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Lookup risk by phone/email/website/upi (public safety check, no auth needed)
export const lookupContact = async (req, res) => {
  try {
    const value = req.query.value?.trim();
    if (!value) return res.status(400).json({ message: "Provide a value to check" });

    const matches = await Report.find({
      $or: [
        { "scamContact.phone": value },
        { "scamContact.email": value },
        { "scamContact.website": value },
        { "scamContact.upiId": value },
      ],
    }).select("title category status createdAt upvotes amountLost scamContact location description");

    const totalUpvotes = matches.reduce((sum, report) => sum + (report.upvotes?.length || 0), 0);
    const totalLoss = matches.reduce((sum, report) => sum + (report.amountLost || 0), 0);
    const riskScore = matches.length
      ? Math.min(
        Math.min(matches.length * 15, 45) +
        Math.min(totalUpvotes * 5, 25) +
        Math.min(Math.floor(totalLoss / 5000), 30),
        100,
      )
      : 0;

    const categories = [...new Set(matches.map((report) => report.category))];
    const statuses = [...new Set(matches.map((report) => report.status))];

    res.json({
      found: matches.length > 0,
      value,
      reportCount: matches.length,
      riskScore,
      totalUpvotes,
      totalLoss,
      categories,
      statuses,
      reports: matches,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
