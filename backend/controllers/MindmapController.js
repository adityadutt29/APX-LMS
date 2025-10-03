const Mindmap = require('../models/Mindmap');

// @desc    Get all mind maps for a user
// @route   GET /api/mindmaps
// @access  Private
const getMindmaps = async (req, res) => {
  try {
    const userId = req.user.id;
    const mindmaps = await Mindmap.find({ user: userId }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: mindmaps,
      count: mindmaps.length
    });
  } catch (error) {
    console.error('Get mindmaps error:', error);
    res.status(500).json({ message: 'Failed to get mindmaps' });
  }
};

// @desc    Create a new mind map
// @route   POST /api/mindmaps
// @access  Private
const createMindmap = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content, title, nodes, connections } = req.body;

    if (!content && !nodes?.length) {
      return res.status(400).json({ message: 'Content or nodes are required' });
    }

    const mindmap = new Mindmap({
      user: userId,
      content: (content || JSON.stringify({ nodes, connections })).trim(),
      title: title?.trim() || 'Generated Mind Map',
      nodes: nodes || [],
      connections: connections || []
    });

    await mindmap.save();

    res.status(201).json({
      success: true,
      data: mindmap,
      message: 'Mind map created successfully'
    });
  } catch (error) {
    console.error('Create mindmap error:', error);
    res.status(500).json({ message: 'Failed to create mindmap' });
  }
};

// @desc    Update a mind map
// @route   PATCH /api/mindmaps/:id
// @access  Private
const updateMindmap = async (req, res) => {
  try {
    const userId = req.user.id;
    const mindmapId = req.params.id;
  const { content, title, nodes, connections } = req.body;

    const mindmap = await Mindmap.findOneAndUpdate(
      { _id: mindmapId, user: userId },
      { 
        content: content ? content.trim() : undefined,
        title: title?.trim(),
        nodes: nodes ?? undefined,
        connections: connections ?? undefined
      },
      { new: true, runValidators: true }
    );

    if (!mindmap) {
      return res.status(404).json({ message: 'Mind map not found' });
    }

    res.json({
      success: true,
      data: mindmap,
      message: 'Mind map updated successfully'
    });
  } catch (error) {
    console.error('Update mindmap error:', error);
    res.status(500).json({ message: 'Failed to update mindmap' });
  }
};

// @desc    Delete a mind map
// @route   DELETE /api/mindmaps/:id
// @access  Private
const deleteMindmap = async (req, res) => {
  try {
    const userId = req.user.id;
    const mindmapId = req.params.id;

    const mindmap = await Mindmap.findOneAndDelete({
      _id: mindmapId,
      user: userId
    });

    if (!mindmap) {
      return res.status(404).json({ message: 'Mind map not found' });
    }

    res.json({
      success: true,
      message: 'Mind map deleted successfully'
    });
  } catch (error) {
    console.error('Delete mindmap error:', error);
    res.status(500).json({ message: 'Failed to delete mindmap' });
  }
};

module.exports = {
  getMindmaps,
  createMindmap,
  updateMindmap,
  deleteMindmap
};
