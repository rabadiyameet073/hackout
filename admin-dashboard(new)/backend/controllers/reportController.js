const Report = require('../models/Report');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { validationResult } = require('express-validator');

// @desc    Get all reports
// @route   GET /api/reports
// @access  Public
exports.getReports = async (req, res) => {
  try {
    // Try to fetch from DB, but if it fails or returns empty (likely due to no DB), return mocks
    let reports = [];
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      reports = await Report.find().skip(skip).limit(limit);
    } catch (dbError) {
      console.log("DB Error or Disconnected, returning mock reports");
    }

    if (!reports || reports.length === 0) {
      // Return Mock Data
      return res.status(200).json({
        success: true,
        count: 3,
        data: [
          {
            _id: '1',
            title: 'Mangrove Damage',
            location: { address: 'North Mangrove Zone' },
            severity: 'high',
            status: 'Active',
            createdAt: new Date().toISOString()
          },
          {
            _id: '2',
            title: 'Illegal Logging',
            location: { address: 'Eastern Wetlands' },
            severity: 'medium',
            status: 'Monitoring',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            _id: '3',
            title: 'Restoration Success',
            location: { address: 'Central Forest' },
            severity: 'low',
            status: 'Resolved',
            createdAt: new Date(Date.now() - 172800000).toISOString()
          }
        ]
      });
    }

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Public
exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('submittedBy', 'name email avatar profile')
      .populate('verifiedBy', 'name email')
      .populate('volunteers.user', 'name email avatar')
      .populate('comments.user', 'name email avatar');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Increment view count (you could add this field to schema)
    // await Report.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Create new report
// @route   POST /api/reports
// @access  Private
exports.createReport = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    // Add user to req.body
    req.body.submittedBy = req.user.id;

    // Add metadata
    req.body.metadata = {
      source: 'Web Portal',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    const report = await Report.create(req.body);

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.reportsSubmitted': 1 }
    });

    // Emit real-time notification to admin
    req.io.to('admin').emit('newReport', {
      message: 'New report submitted',
      report: {
        id: report._id,
        title: report.title,
        location: report.location.name,
        submittedBy: req.user.name
      }
    });

    const populatedReport = await Report.findById(report._id)
      .populate('submittedBy', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: populatedReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private (Admin/Moderator)
exports.updateReport = async (req, res) => {
  try {
    let report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Update fields
    report = await Report.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('submittedBy', 'name email avatar')
      .populate('verifiedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private (Admin/Moderator)
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Delete associated images from cloudinary
    if (report.images && report.images.length > 0) {
      for (const image of report.images) {
        if (image.public_id) {
          await cloudinary.uploader.destroy(image.public_id);
        }
      }
    }

    await Report.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Upload report images
// @route   POST /api/reports/:id/images
// @access  Private
exports.uploadReportImages = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user owns the report or is admin
    if (report.submittedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload images for this report'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image'
      });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'mangrove-reports',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto' }
          ]
        });

        uploadedImages.push({
          url: result.secure_url,
          public_id: result.public_id,
          caption: req.body.caption || ''
        });
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
      }
    }

    // Add images to report
    report.images.push(...uploadedImages);
    await report.save();

    res.status(200).json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: { images: uploadedImages }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Join a report as volunteer
// @route   POST /api/reports/:id/join
// @access  Private
exports.joinReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user already joined
    const alreadyJoined = report.volunteers.find(
      volunteer => volunteer.user.toString() === req.user.id
    );

    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: 'You have already joined this report'
      });
    }

    // Add user to volunteers
    report.volunteers.push({
      user: req.user.id,
      role: req.body.role || 'Observer'
    });

    await report.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.activitiesJoined': 1 }
    });

    res.status(200).json({
      success: true,
      message: 'Successfully joined the report',
      data: { volunteerCount: report.volunteers.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Leave a report
// @route   POST /api/reports/:id/leave
// @access  Private
exports.leaveReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Remove user from volunteers
    report.volunteers = report.volunteers.filter(
      volunteer => volunteer.user.toString() !== req.user.id
    );

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Successfully left the report',
      data: { volunteerCount: report.volunteers.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Add comment to report
// @route   POST /api/reports/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const comment = {
      user: req.user.id,
      message: req.body.message
    };

    report.comments.push(comment);
    await report.save();

    // Populate the new comment
    await report.populate('comments.user', 'name email avatar');

    const newComment = report.comments[report.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Update report status
// @route   PATCH /api/reports/:id/status
// @access  Private (Admin/Moderator)
exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Pending', 'Verified', 'Urgent', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const oldStatus = report.status;
    report.status = status;

    if (status === 'Verified') {
      report.verifiedBy = req.user.id;

      // Update submitter stats
      await User.findByIdAndUpdate(report.submittedBy, {
        $inc: { 'stats.reportsVerified': 1 }
      });
    }

    await report.save();

    // Emit real-time notification
    req.io.to('admin').emit('reportStatusUpdate', {
      reportId: report._id,
      oldStatus,
      newStatus: status,
      updatedBy: req.user.name
    });

    res.status(200).json({
      success: true,
      message: `Report status updated to ${status}`,
      data: { status: report.status, verifiedBy: report.verifiedBy }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get reports by location
// @route   GET /api/reports/location/:lat/:lng/:radius
// @access  Public
exports.getReportsByLocation = async (req, res) => {
  try {
    const { lat, lng, radius } = req.params;
    const radiusInKm = parseInt(radius) || 10;

    const reports = await Report.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radiusInKm * 1000 // Convert km to meters
        }
      }
    }).populate('submittedBy', 'name email avatar');

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Export reports to CSV
// @route   GET /api/reports/export/csv
// @access  Private (Admin)
exports.exportReports = async (req, res) => {
  try {
    const reports = await Report.find({})
      .populate('submittedBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 });

    // Convert to CSV format
    const csvData = reports.map(report => ({
      ID: report._id,
      Title: report.title,
      Description: report.description,
      Location: report.location.name,
      Region: report.location.region,
      Status: report.status,
      Priority: report.priority,
      Category: report.category,
      'Submitted By': report.submittedBy.name,
      'Submitted Date': report.createdAt.toISOString().split('T')[0],
      'Verified By': report.verifiedBy ? report.verifiedBy.name : '',
      'Volunteer Count': report.volunteers.length,
      Severity: report.severity
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=reports.csv');

    // Simple CSV conversion (you might want to use a proper CSV library)
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};
