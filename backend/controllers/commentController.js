import Comment from "../models/Comment.js";

export const addComment = async (req, res) => {
  try {
    const comment = await Comment.create({
      report: req.params.reportId,
      user: req.user._id,
      text: req.body.text,
    });
    const populated = await comment.populate("user", "name");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ report: req.params.reportId })
      .populate("user", "name")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
