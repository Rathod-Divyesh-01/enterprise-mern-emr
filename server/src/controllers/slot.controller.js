const slotService = require('../services/slot.service');

const getSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: 'doctorId and date parameters are required' });
    }
    const slots = await slotService.getAvailableSlots(doctorId, date);
    res.json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSlots };