const express = require('express');
const authController = require('../controllers/auth.controller');
const seekerController = require('../controllers/seeker.controller');

const router = express.Router();

router.post(
  '/generate-email/:seeker',
  authController.protectRoute,
  authController.restrictTo(3),
  seekerController.generateEmail,
);
router.get(
  '/:countryId',
  authController.protectRoute,
  authController.restrictTo(2),
  seekerController.getAllSeeker,
);
router.get(
  '/view-seeker/:id',
  authController.protectRoute,
  authController.restrictTo(2),
  seekerController.getSeekerById,
);
router.patch(
  '/update-seeker/:seeker',
  authController.protectRoute,
  authController.restrictTo(2),
  seekerController.updateSeeker,
);
router.get(
  '/paid-seeker/:countryId',
  authController.protectRoute,
  authController.restrictTo(2),
  seekerController.getPaidSeekers,
);
router.post(
  '/add-seeker-plan/:seeker',
  authController.protectRoute,
  authController.restrictTo(4),
  seekerController.addSeekerPlan,
);
router.patch(
  '/update-seeker-plan/:seeker',
  authController.protectRoute,
  authController.restrictTo(5),
  seekerController.updateSeekerPlan,
);
router.post(
  '/search-seeker',
  authController.protectRoute,
  authController.restrictTo(2),
  seekerController.searchSeeker,
);

module.exports = router;
