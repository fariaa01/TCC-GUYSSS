module.exports = (req, res, next) => {
  res.locals.showTour = req.cookies?.tour_done !== '1';
  next();
};