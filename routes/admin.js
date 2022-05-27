var express = require("express");
var router = express.Router();
const productHelper = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const adminHelpers = require("../helpers/admin-helpers");
const genersHelpers = require("../helpers/geners.helpers");
const authorsHelpers = require("../helpers/Author-helpers");

const WEEK_SECONDS = 7 * 24 * 60 * 60 * 1000;
const MONTH_SECONDS = 30 * 24 * 60 * 60 * 1000;
const YEAR_SECONDS = 365.25 * 24 * 60 * 60 * 1000;

// verifyLogin
const verifyLogin = (req, res, next) => {
  if (req.session.adminloggedIn) {
    next();
  } else {
    let invalid = req.session.invalidadmin;

    res.render("admin/admin-login", { unknown: true, invalid });
    req.session.invalidadmin = false;
  }
};

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.redirect("/admin/Dashboard");
});
// admin login
router.get("/login", verifyLogin, (req, res) => {
  res.redirect("/admin/Dashboard");
});
// admin dashboard
router.get("/Dashboard", verifyLogin, async (req, res) => {
  userHelpers.getAllUserOrderstoDashboard().then((orderData) => {
    productHelper.getAllProducts().then((products) => {
      adminHelpers.TotalOders().then((total) => {
        adminHelpers.Totalprofit().then((totalprofit) => {
          adminHelpers.Totalsales().then((totalsales) => {
            adminHelpers.Totalusers().then((totalusers) => {
              res.render("admin/Dashboard", {
                total,
                orderData,
                products,
                totalprofit,
                totalsales,
                totalusers,
                admin: true,
              });
            });
          });
        });
      });
    });
  });
});

//get add product page
router.get("/add-product", (req, res) => {
  let gener = req.session.gener;
  genersHelpers.getAllGeners().then((geners) => {
    res.render("admin/add-product", { admin: true, geners, gener });
  });
});

// post req to add-product
router.post("/add-product", (req, res) => {
  productHelper.addProduct(req.body, (id) => {
    let image = req.files?.Image;

    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        genersHelpers.getAllGeners().then((geners) => {
          res.render("admin/add-product", { admin: true, geners });
        });
      }
    });
  });
});

// delete product
router.get("/delete-product", (req, res) => {
  let proId = req.query.id;
  productHelper.deleteProduct(proId).then((response) => {
    res.redirect("/admin/view-products");
  });
});
// delete user
router.get("/delete-user/:id", (req, res) => {
  let UserId = req.params.id;
  userHelpers.deleteUsers(UserId).then((response) => {
    res.redirect("/admin/view-users");
  });
});
// get edit product request
router.get("/edit-product/:id", async (req, res) => {
  let gener = req.session.gener;
  let product = await productHelper.getProductDetails(req.params.id);
  genersHelpers.getAllGeners().then((geners) => {
    res.render("admin/edit-product", { product, geners, gener });
  });
});
// edit product
router.post("/edit-product/:id", (req, res) => {
  let id = req.params.id;
  productHelper.updateProduct(req.params.id, req.body).then(() => {
    res.redirect("/admin/view-products");
    if (req.files?.Image) {
      let image = req.files?.Image;
      image.mv("./public/product-images/" + id + ".jpg");
    }
  });
});
// view users list
router.get("/view-users", function (req, res) {
  userHelpers.getAllUsers().then((users) => {
    users.map((users) => {
      users.isUnblocked = users.status === "unblock" ? true : false;
    });
    res.render("admin/view-users", { users, admin: true });
  });
});
// block user
router.get("/edit-user/:id", function (req, res) {
  let id = req.params.id;
  userHelpers.updateUser(req.params.id).then(() => {
    res.redirect("/admin/view-users");
  });
});
// unblock user
router.get("/editt-user/:id", function (req, res) {
  let id = req.params.id;
  userHelpers.updateUserr(req.params.id).then(() => {
    res.redirect("/admin/view-users");
  });
});
// admin login post req
router.post("/login", (req, res) => {
  adminHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.adminloggedIn = true;
      req.session.admin = response.admin;
      res.redirect("/admin");
    } else {
      req.session.invalidadmin = "Invalid Email or Password";
      res.redirect("/admin");
      req.session.adminloggedIn = false;
    }
  });
});

//admin-logout
router.get("/logout", (req, res) => {
  req.session.adminloggedIn = false;
  res.redirect("/admin");
});
// view product
router.get("/admin/view-products", (req, res) => {
  productHelper.getAllProducts().then((products) => {
    res.render("admin/view-products", { products, admin: true });
  });
});
// view product in admin view product page
router.get("/view-products", (req, res) => {
  productHelper.getAllProductsNoLimit().then((products) => {
    res.render("admin/view-products", { products, admin: true });
  });
});
//view orders
router.get("/view-orders", async (req, res) => {
  let OrderData = await userHelpers.getAllUserOrders();
  res.render("admin/view-orders", { admin: true, OrderData });
});
//get add geners page
router.get("/add-geners", (req, res) => {
  res.render("admin/add-geners", { admin: true });
});
// add geners
router.post("/add-geners", (req, res) => {
  genersHelpers.addGener(req.body, (err) => {
    if (!err) {
      res.redirect("/admin/add-geners");
    } else {
    }
  });
});
// get geners list
router.get("/geners-list", (req, res) => {
  genersHelpers.getAllGeners().then((geners) => {
    res.render("admin/geners-list", { geners, admin: true });
  });
});
// delete gener
router.get("/delete-gener/:id", (req, res) => {
  let GenrId = req.params.id;
  genersHelpers.deleteGenres(GenrId).then((response) => {
    res.redirect("/admin/geners-list");
  });
});
// get add author page
router.get("/add-authors", (req, res) => {
  res.render("admin/add-authors");
});
// add author
router.post("/add-authors", (req, res) => {
  authorsHelpers.addAuthor(req.body, (err) => {
    if (!err) {
      res.redirect("/admin/add-authors", { admin: true });
    } else {
    }
  });
});
// weekly report
router.get("/weekly-report", function (req, res) {
  let nowDate = new Date();
  let previousWeek = new Date(nowDate - WEEK_SECONDS);
  userHelpers.getWeekReport(previousWeek).then((response) => {
    report = response;
    res.render("admin/weekly-report", { report, admin: true });
  });
});
// monthly report
router.get("/monthly-report", function (req, res) {
  let nowDate = new Date();
  let previousMonth = new Date(nowDate - MONTH_SECONDS);
  userHelpers.getMonthReport(previousMonth).then((response) => {
    report = response;
    res.render("admin/monthly-report", { report, admin: true });
  });
});
//yearly report
router.get("/yearly-report", function (req, res) {
  let nowDate = new Date();
  let previousYear = new Date(nowDate - YEAR_SECONDS);
  userHelpers.getYearReport(previousYear).then((response) => {
    report = response;
    res.render("admin/yearly-report", { report, admin: true });
  });
});
// add coupon to users
router.get("/Add-coupon", (req, res) => {
  res.render("admin/Add-coupon", { admin: true });
});
//  add-coupon code
router.post("/Add-coupon", (req, res) => {
  adminHelpers.addCoupon(req.body).then(() => {
    res.redirect("/admin/coupons");
  });
});
// get coupon list page
router.get("/coupons", (req, res) => {
  adminHelpers.getAllCoupons().then((coupons) => {
    res.render("admin/coupons", { coupons, admin: true });
  });
});
// delete coupon code
router.get("/delete-coupon/:id", (req, res) => {
  adminHelpers.deleteCoupon(req.params.id).then(() => {
    res.redirect("/admin/coupons");
  });
});
//get chart details
router.get("/ChartDetails", async (req, res) => {
  let orders = await userHelpers.getUserOrdersplaceOrder();
  res.render("admin/ChartDetails", { orders, admin: true });
});
// get weekly,montlty and yearly chart
router.get("/getChartDates", async (req, res) => {
  let month = await adminHelpers.countsalemonth();
  let dailySales = await adminHelpers.countDaySales();
  let yearlySales = await adminHelpers.getYearlySale();
  res.json({ dailySales, yearlySales, month });
});
//get banner page
router.get("/add-Banner", (req, res) => {
  res.render("admin/add-Banner", { admin: true });
});
// add banner
router.post("/add-Banner", (req, res) => {
  productHelper.addBanner(req.body, (id) => {
    let image = req.files?.Image;

    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("admin/add-Banner", { admin: true });
      }
    });
  });
});
// view banner list
router.get("/view-banners", (req, res) => {
  productHelper.getAllBannerview().then((banner) => {
    res.render("admin/view-banners", { admin: true, banner });
  });
});
//delete banner
router.get("/delete-banner/:id", (req, res) => {
  productHelper.deleteBanner(req.params.id).then(() => {
    res.redirect("/admin/view-banners");
  });
});
// add delivery status of user
router.post("/deliverystatus", (req, res) => {
  let status = req.body.status;
  let orderId = req.body.orderId;
  adminHelpers.updatedeliverystatus(status, orderId).then((response) => {
    res.json(true);
  });
});
module.exports = router;
