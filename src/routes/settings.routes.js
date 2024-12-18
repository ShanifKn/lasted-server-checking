const express = require('express');
const designationController = require('../controllers/designations.controller');
const industryController = require('../controllers/industries.controller');
const planController = require('../controllers/plan.controller');
const authController = require('../controllers/auth.controller');
const categoryController = require('../controllers/category.contoller');
const countryController = require('../controllers/countries.controller');
const locationController = require('../controllers/location.controller');
const skillController = require('../controllers/skill.controller');
const languageController = require('../controllers/language.controller');
const genderController = require('../controllers/gender.controller');
const cronJobsController = require('../controllers/cronjob.controller');
const menuController = require('../controllers/menu.controller');
const messageController = require('../controllers/message.controller');
const visaTypeController = require('../controllers/visaTypes.controller');
const documentTypeController = require('../controllers/documentTypes.controller');
const router = express.Router();

router.post(
  '/add-country',
  authController.protectRoute,
  authController.restrictTo(6),
  countryController.addCountry,
);
router.patch(
  '/update-country/:country',
  authController.protectRoute,
  authController.restrictTo(6),
  countryController.updateCountry,
);
router
  .route('/countries')
  .get(
    authController.protectRoute,
    authController.restrictTo(4),
    countryController.getAllCountries,
  );

router
  .route('/countries/:country')
  .get(
    authController.protectRoute,
    authController.restrictTo(4),
    countryController.getCountry,
  );

router
  .route('/apply-countries')
  .get(
    authController.protectRoute,
    authController.restrictTo(2),
    countryController.getAllApplyCountries,
  );
router
  .route('/locations/:country')
  .get(
    authController.protectRoute,
    authController.restrictTo(4),
    locationController.getAllLocations,
  );
router.post(
  '/add-location',
  authController.protectRoute,
  authController.restrictTo(6),
  locationController.addLocation,
);
router
  .route('/update-location/:location')
  .patch(
    authController.protectRoute,
    authController.restrictTo(6),
    locationController.updateLocation,
  );

router
  .route('/view-location/:location')
  .get(
    authController.protectRoute,
    authController.restrictTo(4),
    locationController.getLocation,
);

router.get(
  '/industries',
  authController.protectRoute,
  authController.restrictTo(4),
  industryController.getAllIndustries,
);
router.post(
  '/add-industry',
  authController.protectRoute,
  authController.restrictTo(6),
  industryController.addIndustries,
);
router
  .route('/update-industry/:industry')
  .patch(
    authController.protectRoute,
    authController.restrictTo(6),
    industryController.updateIndustry,
  );
router
  .route('/categories')
  .get(
    authController.protectRoute,
    authController.restrictTo(4),
    categoryController.getAllCategories,
  );
router.patch(
  '/update-category/:category',
  authController.protectRoute,
  authController.restrictTo(6),
  categoryController.updateCategory,
);

router.post(
  '/update-category-values',
  authController.protectRoute,
  authController.restrictTo(3),
  categoryController.updateCategoryValues,
);

router
  .route('/plans/:country')
  .get(
    authController.protectRoute,
    authController.restrictTo(4),
    planController.getAllPlans,
  );
router.post(
  '/add-plan',
  authController.protectRoute,
  authController.restrictTo(6),
  planController.addPlan,
);
router.patch(
  '/update-plan/:plan',
  authController.protectRoute,
  authController.restrictTo(6),
  planController.updatePlan,
);

router.get(
  '/skills',
  authController.protectRoute,
  authController.restrictTo(4),
  skillController.getAllSkills,
);
router.post(
  '/add-skill',
  authController.protectRoute,
  authController.restrictTo(4),
  skillController.addSkill,
);
router.patch(
  '/update-skill/:skill',
  authController.protectRoute,
  authController.restrictTo(5),
  skillController.updateSkill,
);

router.get(
  '/languages',
  authController.protectRoute,
  authController.restrictTo(4),
  languageController.getAllLanguages,
);
router.post(
  '/add-language',
  authController.protectRoute,
  authController.restrictTo(4),
  languageController.addLanguage,
);
router.patch(
  '/update-language/:language',
  authController.protectRoute,
  authController.restrictTo(5),
  languageController.updateLangauge,
);

router.get(
  '/cron-jobs',
  authController.protectRoute,
  authController.restrictTo(6),
  cronJobsController.getAllCronjobs,
);
router.post(
  '/add-cron-job',
  authController.protectRoute,
  authController.restrictTo(6),
  cronJobsController.addCronjob,
);
router.patch(
  '/update-cron-job/:cronjob',
  authController.protectRoute,
  authController.restrictTo(6),
  cronJobsController.updateCronJob,
);

router.get(
  '/menu',
  authController.protectRoute,
  authController.restrictTo(4),
  menuController.getAllMenus,
);
router.patch(
  '/update-menu/:menu',
  authController.protectRoute,
  authController.restrictTo(6),
  menuController.updateMenu,
);

router.post(
  '/add-message',
  authController.protectRoute,
  authController.restrictTo(6),
  messageController.createMessage,
);
router
  .route('/messages')
  .get(
    authController.protectRoute,
    authController.restrictTo(6),
    messageController.getAllMessages,
  );
router.patch(
  '/update-message/:message',
  authController.protectRoute,
  authController.restrictTo(6),
  messageController.updateMessage,
);

router.get(
  '/gender',
  authController.protectRoute,
  authController.restrictTo(1),
  genderController.getGenders,
);
// router
//   .route('/plans')
//   .get(authController.protectRoute, planController.getAllPlans)
//   .post(authController.protectRoute);

// router.route('/locations/:id').get(locationController.getAllLocations);

router.get(
  '/visaTypes/:country',
  authController.protectRoute,
  authController.restrictTo(4),
  visaTypeController.getAllVisaTypes,
);

router.post(
  '/add-visaType',
  authController.protectRoute,
  authController.restrictTo(6),
  visaTypeController.addVisaType,
);

router
  .route('/update-visaType/:visaType')
  .patch(
    authController.protectRoute,
    authController.restrictTo(6),
    visaTypeController.updateVisaType,
);

router.get(
  '/document-type',
  authController.protectRoute,
  authController.restrictTo(4),
  documentTypeController.getAllDocTypes,
);

router
  .route('/update-document-type/:docType')
  .patch(
    authController.protectRoute,
    authController.restrictTo(6),
    documentTypeController.updateDocType,
);


module.exports = router;
