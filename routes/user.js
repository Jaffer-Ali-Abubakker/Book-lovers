const { response } = require("express");
var express = require("express");
var router = express.Router();
const productHelper = require("../helpers/product-helpers");
const userHelper = require("../helpers/user-helpers");
const session = require("express-session");
const paypal = require("paypal-rest-sdk");
const adminHelpers = require("../helpers/admin-helpers");
const userHelpers = require("../helpers/user-helpers");
require("dotenv").configconst

//twilio otp
const accountSID = process.env.accountSid;
const authToken = process.env.authToken;
const serviceSID = process.env.serviceSID;

// paypal id $ secret
paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: process.env.client_id,
  client_secret: process.env.client_secret,
});

const Client = require("twilio")(accountSID, authToken);
/* GET home page. */
const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};
// user view page
router.get("/", async function (req, res, next) {
  let user = req.session.user;
  let todayDate = new Date().toLocaleDateString();
  let cartCount = null;
  let wishCount = null;
  if (req.session.user) {
    wishCount = await userHelpers.getWishCount(req.session.user._id);
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  let startCoupon = await adminHelpers.startCouponOffers(todayDate);
  productHelper.getAllProductsMainpage().then((products) => {
    productHelper.getnewarrival().then((newarrival) => {
      productHelper.getrecommended().then((recommended) => {
        userHelper.viewusermessage1().then((message1) => {
          userHelper.viewusermessage3().then((message2) => {
            productHelper.getAllBanner().then((banner) => {
              res.render("user/view-products", {
                products,
                user,
                cartCount,
                startCoupon,
                wishCount,
                newarrival,
                search: true,
                recommended,
                banner,
                message1,
                message2,
              });
            });
          });
        });
      });
    });
  });
});
//get user login
router.get("/login", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/login", { loginErr: req.session.loginErr });
    req.session.loginErr = false;
  }
});
//get user signup page
router.get("/signup", (req, res) => {
  res.render("user/signup");
});
//user signup
router.post("/signup", async (req, res) => {
  let email = req.body.Email;
  let phone = req.body.phoneNumber;
  userHelper.emailCheck(email, phone).then((response) => {
    if (response) {
      res.render("user/signup", { error: true });
      error = false;
    } else {
      userHelper.doSignup(req.body).then((response) => {
        req.session.loggedIn = true;
        req.session.user = response;
        res.render("user/otp-login");
      });
    }
  });
});
// user login
router.post("/login", (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      if (response.user.status === "unblock") {
        req.session.loggedIn = true;
        req.session.user = response.user;
        res.redirect("/");
      } else {
        req.session.loginErr = "sorry your account is blocked";
        res.redirect("/login");
      }
    } else {
      req.session.loginErr = "Invalid Email or Password";
      res.redirect("/login");
    }
  });
});
// user logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});
// get gener page
router.get("/user/genersplusproduct", verifyLogin, async function (req, res) {
  let gener = req.session.gener;
  let user = req.session.user;
  let id = req.params.id;
  let cartCount = null;
  if (user) {
    cartCount = await userHelper.getCartCount(user._id);
  }
  let geners = await productHelper.getAllProducts();
  let wishCount = await userHelpers.getWishCount(req.session.user._id);
  res.render("user/genersplusproduct", {
    geners,
    wishCount,
    user,
    id,
    cartCount,
    gener,
  });
});
// get author page
router.get(
  "/user/Authorslistplus-product",
  verifyLogin,
  async function (req, res) {
    let author = req.session.author;
    let user = req.session.user;
    let id = req.params.id;
    let cartCount = null;
    if (user) {
      cartCount = await userHelper.getCartCount(user._id);
    }
    let authors = await productHelper.getAllProducts();
    let wishCount = await userHelpers.getWishCount(req.session.user._id);
    res.render("user/Authorslistplus-product", {
      authors,
      wishCount,
      user,
      id,
      cartCount,
      author,
    });
  }
);
// sign up otp
router.post("/otp-login", (req, res) => {
  let userId = req.session.user;
  let data = req.body;
  userHelper.addphoneDetails(data, userId).then((datas) => {
    Client.verify
      .services(serviceSID)
      .verifications.create({
        to: `+91${req.body.phoneNumber}`,
        channel: "sms",
      })
      .then((resp) => {
        req.session.phoneNumber = resp.to;
        res.redirect("/otp");
      });
  });
});
//otp verificationChecks
router.post("/otp", (req, res) => {
  const otp = req.body.otp;
  mobNo = req.session.phoneNumber;
  Client.verify
    .services(serviceSID)
    .verificationChecks.create({
      to: mobNo,
      code: otp,
    })
    .then((response) => {
      if (response.valid) {
        res.redirect("/login");
      } else {
        req.session.invalidOtp = true;
        res.redirect("/otp-login");
      }
    });
});
//get otp page
router.get("/otp", (req, res) => {
  res.render("user/otp");
});
// add to cart
router.get("/add-to-cart", verifyLogin, async (req, res) => {
  let product = await productHelper.getProductDetails(req.query.id);
  userHelper
    .addToCart(req.query.id, req.session.user._id, product)
    .then((response) => {
      res.json({ status: true });
    });
});
// render to cart page
router.get("/cart", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let id = user._id;
  let cartCount = null;
  let discount = await userHelper.getDiscount(user._id);
  let discountVal = discount / 74;
  discountVal = Number(discountVal).toFixed(2);
  if (user) {
    cartCount = await userHelper.getCartCount(user._id);
  }
  let products = await userHelper.getCartProducts(user._id);
  let totalValue = await userHelper.getTotalAmount(user._id);
  let wishCount = await userHelpers.getWishCount(user._id);
  totalValue = Number(totalValue).toFixed(2);
  let finalorder = totalValue - discountVal;
  finalorder = Number(finalorder).toFixed(2);
  req.session.orderAmt = finalorder;

  if (cartCount==0){
    res.render('user/cart-is-empty',{     
    products,
    user,
    totalValue,
    finalorder,
    discountVal,
    cartCount,
    wishCount,})
  }else{
    res.render("user/cart", {
      products,
      user,
      totalValue,
      finalorder,
      discountVal,
      cartCount,
      wishCount,
    });
  } 
});
//change-product-quantity
router.post("/change-product-quantity", (req, res, next) => {

  userHelper.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelper.getTotalAmount(req.body.user);
    res.json(response);
  });
});
//delete item from cart
router.post("/delete-cart-item", (req, res) => {
  userHelper.DeleteCartProduct(req.body).then((response) => {
    res.json(response);
  });
});
// get placeorder page
router.get("/place-order", verifyLogin, async (req, res) => {
  let user = req.session.user;
  finalorder = req.session.orderAmt;
  let orders = await userHelper.getUserOrdersplaceOrder(req.session.user._id);
  let total = await userHelper.getTotalAmount(req.session.user._id);
  let userdetails = await userHelpers.getAllUserDetails(req.session.user._id);
  res.render("user/place-order", {
    orders,
    total,
    user: req.session.user,
    finalorder,
    userdetails,
  });
});
// place order
router.post("/place-order", async (req, res) => {
  let user = req.session.user;
  finalorder = req.session.orderAmt;
  if (req.session?.couponId) {
    userHelper.couponStatusAdd(req.body.UserId, req.session.couponId);
  }
  let products = await userHelper.getCartProductList(req.body.UserId);
  let totalPrice = await userHelper.getTotalAmount(req.body.UserId);
  userHelper
    .placeOrder(req.body, products.products, totalPrice)
    .then((orderId) => {
      if (req.body["payment-method"] == "COD") {
        res.json({ codSuccess: true });
      } else if (req.body["payment-method"] == "Razorpay") {
        userHelper.generateRazorpay(orderId, finalorder).then((response) => {
          res.json({ ...response, razorpay: true });
        });
      } else if (req.body["payment-method"] == "paypal") {
        let val = finalorder / 74;
        let total = val.toFixed(2);
        let totals = total.toString();
        req.session.total = totals;

        const create_payment_json = {
          intent: "sale",
          payer: {
            payment_method: "paypal",
          },
          redirect_urls: {
            return_url: "http://booklovers.cfd/success",
            cancel_url: "http://booklovers.cfd/cancel",
          },
          transactions: [
            {
              item_list: {
                items: [
                  {
                    name: "Book Lovers",
                    sku: "001",
                    price: totals,
                    currency: "USD",
                    quantity: 1,
                  },
                ],
              },
              amount: {
                currency: "USD",
                total: totals,
              },
              description: "Thank u for visit",
            },
          ],
        };

        paypal.payment.create(create_payment_json, function (error, payment) {
          if (error) {
            throw error;
          } else {
            for (let i = 0; i < payment.links.length; i++) {
              if (payment.links[i].rel === "approval_url") {
                let url = payment.links[i].href;
                res.json({ url });
              } else {
              }
            }
          }
        });
        // payment success page
        router.get("/success", (req, res) => {
          const payerId = req.query.PayerID;
          const paymentId = req.query.paymentId;
          let total = req.session.total;

          let totals = total.toString();
          const execute_payment_json = {
            payer_id: payerId,
            transactions: [
              {
                amount: {
                  currency: "USD",
                  total: totals,
                },
              },
            ],
          };
          paypal.payment.execute(
            paymentId,
            execute_payment_json,
            function (error, payment) {
              if (error) {
                throw error;
              } else {
                console.log(JSON.stringify(payment));
                userHelper.changePaymentStatus(req.session.orderId).then(() => {
                  userHelper
                    .DeleteCartProduct(req.session.user._id)
                    .then(() => {
                      res.redirect("/order-success");
                    });
                });
              }
            }
          );
        });
        // payment cancel page
        router.get("/cancel", verifyLogin, async (req, res) => {
          let user = req.session.user;
          let cartCount = null;
          if (user) {
            cartCount = await userHelper.getCartCount(user._id);
          }
          res.render("user/payment-failed", { user, cartCount });
        });
      }
    });
});
//order success page
router.get("/order-success", verifyLogin, async (req, res) => {
  res.render("user/order-success", { user: req.session.user });
});
// get user order page
router.get("/orders", verifyLogin, async (req, res) => {
  let orders = await userHelper.getUserOrders(req.session.user._id);
  res.render("user/orders", { user: req.session.user, orders });
});
//get view-order-products
router.get("/view-order-products/:id", async (req, res) => {
  let products = await userHelper.getOrderProducts(req.params.id);
  res.render("user/view-order-products", { user: req.session.user, products });
});
//get admin view order page
router.get("/view-order-productsadmin/:id", async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id);
  res.render("user/view-order-productsadmin", {
    user: req.session.user,
    products,
  });
});
// get single products page
router.get("/single-product/:id", verifyLogin, async function (req, res) {
  let user = req.session.user;
  let id = req.params.id;
  let cartCount = null;
  if (user) {
    cartCount = await userHelper.getCartCount(user._id);
    wishCount = await userHelper.getWishCount(user._id);
  }
  let details = await productHelper.getProductDetails(req.params.id);
  res.render("user/single-product", { details, user, id, cartCount });
});
//Razorpay verify-payment
router.post("/verify-payment", (req, res) => {
  userHelper
    .verifyPayment(req.body)
    .then(() => {
      userHelper.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        res.json({ status: true });
      });
    })
    .catch((err) => {
      res.json({ status: false, errMsg: "" });
    });
});
// user coupon apply
router.post("/couponApply", verifyLogin, (req, res) => {
  let id = req.session.user;
  userHelpers.couponValidate(req.body, id).then((response) => {
    req.session.couponTotal = response.total;
    req.session.couponId = response.couponId;
    if (response.success) {
      res.json({ couponSuccess: true, total: response.total });
    } else if (response.couponUsed) {
      res.json({ couponUsed: true });
    } else if (response.couponExpired) {
      res.json({ couponExpired: true });
    } else {
      res.json({ invalidCoupon: true });
    }
  });
});
//get user profile page
router.get("/user-profile", async (req, res) => {
  let userdetails = await userHelpers.getAllUserDetails(req.session.user._id);
  res.render("user/user-profile", { user: req.session.user, userdetails });
});
//author list
router.post("/Authorslistplus-product", async (req, res) => {
  let user = req.session.user;
  let id = req.params.id;
  let cartCount = null;
  let wishCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(user._id);
    wishCount = await userHelpers.getWishCount(user._id);
    authors = await productHelper.getAllProducts(user._id);
  }
  productHelper.getProductAuthors(req.body).then((authorsproduct) => {
    res.render("user/Authorslistplus-product", {
      authorsproduct,
      user,
      cartCount,
      wishCount,
      authors,
    });
  });
});
// geners list
router.post("/genersplusproduct", async (req, res) => {
  let user = req.session.user;
  let id = req.params.id;
  let cartCount = null;
  let wishCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(user._id);
    wishCount = await userHelpers.getWishCount(user._id);
    geners = await productHelper.getAllProducts(user._id);
  }
  productHelper.getProductgeners(req.body).then((generproduct) => {
    res.render("user/genersplusproduct", {
      generproduct,
      user,
      cartCount,
      wishCount,
      geners,
    });
  });
});
// geners products page form main page
router.post("/geners-product", async (req, res) => {
  let user = req.session.user;
  let id = req.params.id;
  let cartCount = null;
  let wishCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(user._id);
    wishCount = await userHelpers.getWishCount(user._id);
    geners = await productHelper.getAllProducts(user._id);
  }
  productHelper.getProductgeners(req.body).then((generproduct) => {
    res.render("user/geners-product", {
      generproduct,
      user,
      cartCount,
      wishCount,
      geners,
    });
  });
});
// product add to wish list
router.get("/added-to-wishList", async (req, res) => {
  let userId = req.session.user._id;
  let proId = req.query.id;
  userHelpers.addedToWishList(proId, userId).then((response) => {
    productHelper.wishUpdate(userId, proId).then((response) => {
      productHelper.wishTrue(userId, proId).then((response) => {
        res.json({ status: true });
      });
    });
  });
});
// get wishlist page
router.get("/wishList", verifyLogin, async (req, res) => {
  let products = await userHelpers.getWishProducts(req.session.user._id);
  let wishCount = await userHelpers.getWishCount(req.session.user._id);
  let cartCount = await userHelpers.getCartCount(req.session.user._id);

  res.render("user/wishlist", {
    user: req.session.user,
    products,
    wishCount,
    cartCount,
  });
});
// delete wish-product
router.post("/remove-wishProduct", (req, res) => {
  userHelpers.removeWishProduct(req.body).then((response) => {
    productHelper
      .removeWish(req.session.user._id, req.body.product)
      .then((response) => {
        res.json(response);
      });
  });
});
// remove wish
router.post("/remove-wish", (req, res) => {
  userHelpers
    .removeWishList(req.body.product, req.session.user._id)
    .then((result) => {
      productHelper
        .removeWish(req.session.user._id, req.body.product)
        .then((response) => {
          res.json(result);
        });
    });
});
// edit password from user page
router.get("/edit-password", verifyLogin, async (req, res) => {
  let passErr = req.session.passwordNotMatch;
  let user = req.session.user;
  let products = await userHelpers.getWishProducts(req.session.user._id);
  let wishCount = await userHelpers.getWishCount(req.session.user._id);
  let cartCount = await userHelpers.getCartCount(req.session.user._id);

  res.render("user/edit-password", {
    user: req.session.user,
    products,
    wishCount,
    cartCount,
    user,
    passErr,
  });
  req.session.passwordNotMatch = false;
});
// edit password
router.post("/edit-password", (req, res) => {
  let userId = req.session.user._id;
  userHelpers.passwordMatch(req.body.oldPassword, userId).then((response) => {
    if (response) {
      userHelpers
        .updatePassword(req.body.newPassword, userId)
        .then((response) => {
          req.session.destroy();
          res.redirect("/login");
        });
    } else {
      req.session.passwordNotMatch = "Old Password is Wrong";
      res.redirect("/edit-password");
    }
  });
});
// get add-address page
router.get("/add-address", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let products = await userHelpers.getWishProducts(req.session.user._id);
  let wishCount = await userHelpers.getWishCount(req.session.user._id);
  let cartCount = await userHelpers.getCartCount(req.session.user._id);
  let userdetails = await userHelpers.getAllUserDetails(req.session.user._id);

  res.render("user/add-address", {
    user: req.session.user,
    products,
    wishCount,
    cartCount,
    user,
    userdetails,
  });
});
// add user-address
router.post("/add-address", (req, res) => {
  let userId = req.session.user._id;
  userHelper.addAddress(userId, req.body).then((response) => {
    res.redirect("/user-profile");
  });
});
//edit user profile
router.get("/edit-profile", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let products = await userHelpers.getWishProducts(req.session.user._id);
  let wishCount = await userHelpers.getWishCount(req.session.user._id);
  let cartCount = await userHelpers.getCartCount(req.session.user._id);
  let userdetails = await userHelpers.getAllUserDetails(req.session.user._id);
  let users = await userHelper.getAllUsers();

  res.render("user/edit-profile", {
    user: req.session.user,
    products,
    wishCount,
    cartCount,
    user,
    users,
    userdetails,
  });
});
// edit-profile
router.post("/edit-profile", (req, res) => {
  let userId = req.session.user._id;

  userHelpers.editDetails(userId, req.body).then((response) => {
    res.redirect("/user-profile");
  });
});
// contact us
router.post("/user-message", verifyLogin, (req, res) => {
  userHelper.addusermessage(req.body).then((response) => {
    res.redirect("/");
  });
});
// get cart empty page
router.get("/cart-is-empty", (req, res) => {
  res.render("user/cart-is-empty");
});
//search-products
router.post("/search", async (req, res) => {
  let payload = req.body.payload.trim();
  let search = await userHelper.searchProduct(payload);
  search = search.slice(0, 10);
  res.send({ payload: search });
});
//cancel order
router.post("/cancel-order", async (req, res) => {
  let cancel = await userHelper.canelOrderreq(req.body);
  let orders = await userHelper.getUserOrders(req.session.user._id);
  res.render("user/orders", { orders, cancel });
});
// search result page
router.get("/image-view", (req, res) => {
  let id = req.query.id;
  if (req.session?.user) {
    productHelper.getProductDetails(id).then(async (details) => {
      let wishCount = await userHelper.getWishCount(req.session.user._id);
      let cartCount = null;
      if (req.session.user) {
        cartCount = await userHelper.getCartCount(req.session.user._id);
      }
      let user = req.session.user;
      res.render("user/single-product", {
        details,
        user,
        cartCount,
        wishCount,
      });
    });
  } else {
    productHelper.getProductDetails(id).then((details) => {
      res.render("user/single-product", { details });
    });
  }
});

module.exports = router;
