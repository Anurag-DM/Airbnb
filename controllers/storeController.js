const Home = require("../models/home");
const User = require("../models/user");
const Booking = require("../models/booking");

exports.getIndex = (req, res, next) => {
  console.log("Session Value: ", req.session);
  Home.find().then((registeredHomes) => {
    res.render("store/index", {
      registeredHomes: registeredHomes,
      pageTitle: "airbnb Home",
      currentPage: "index",
      isLoggedIn: req.isLoggedIn, 
      user: req.session.user,
    });
  });
};

exports.getHomes = (req, res, next) => {
  Home.find().then((registeredHomes) => {
    res.render("store/home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Homes List",
      currentPage: "Home",
      isLoggedIn: req.isLoggedIn, 
      user: req.session.user,
    });
  });
};

exports.getBookings = async (req, res, next) => {
  const userId = req.session.user._id;
  const bookings = await Booking.find({ user: userId })
    .populate("home")
    .sort({ bookedAt: -1 });
  res.render("store/bookings", {
    bookings: bookings,
    pageTitle: "My Bookings",
    currentPage: "bookings",
    isLoggedIn: req.isLoggedIn, 
    user: req.session.user,
  });
};

exports.getFavouriteList = async (req, res, next) => {
  const userId = req.session.user._id;
  const user = await User.findById(userId).populate('favourites');
  res.render("store/favourite-list", {
    favouriteHomes: user.favourites,
    pageTitle: "My Favourites",
    currentPage: "favourites",
    isLoggedIn: req.isLoggedIn, 
    user: req.session.user,
  });
};

exports.postAddToFavourite = async (req, res, next) => {
  const homeId = req.body.id;
  const userId = req.session.user._id;
  const user = await User.findById(userId);
  if (!user.favourites.includes(homeId)) {
    user.favourites.push(homeId);
    await user.save();
  }
  res.redirect("/favourites");
};

exports.postRemoveFromFavourite = async (req, res, next) => {
  const homeId = req.params.homeId;
  const userId = req.session.user._id;
  const user = await User.findById(userId);
  if (user.favourites.includes(homeId)) {
    user.favourites = user.favourites.filter(fav => fav != homeId);
    await user.save();
  }
  res.redirect("/favourites");
};

exports.getReserveHome = (req, res, next) => {
  const homeId = req.params.homeId;
  Home.findById(homeId).then((home) => {
    if (!home) {
      console.log("Home not found");
      res.redirect("/homes");
    } else {
      res.render("store/reserve", {
        home: home,
        pageTitle: "Reserve " + home.houseName,
        currentPage: "Home",
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
        errors: [],
        oldInput: { checkInDate: "", checkOutDate: "" },
      });
    }
  });
};

exports.postAddBooking = async (req, res, next) => {
  const { homeId, checkInDate, checkOutDate } = req.body;
  const userId = req.session.user._id;

  const home = await Home.findById(homeId);
  if (!home) {
    return res.redirect("/homes");
  }

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const totalNights = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));

  if (!checkInDate || !checkOutDate || totalNights <= 0) {
    return res.render("store/reserve", {
      home: home,
      pageTitle: "Reserve " + home.houseName,
      currentPage: "Home",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
      errors: ["Please select a valid check-out date after the check-in date"],
      oldInput: { checkInDate, checkOutDate },
    });
  }

  const booking = new Booking({
    home: homeId,
    user: userId,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    totalNights: totalNights,
    totalPrice: totalNights * home.price,
  });

  await booking.save();
  res.redirect("/bookings");
};

exports.postCancelBooking = async (req, res, next) => {
  const bookingId = req.params.bookingId;
  const userId = req.session.user._id;
  await Booking.deleteOne({ _id: bookingId, user: userId });
  res.redirect("/bookings");
};

exports.getHomeDetails = (req, res, next) => {
  const homeId = req.params.homeId;
  Home.findById(homeId).then((home) => {
    if (!home) {
      console.log("Home not found");
      res.redirect("/homes");
    } else {
      res.render("store/home-detail", {
        home: home,
        pageTitle: "Home Detail",
        currentPage: "Home",
        isLoggedIn: req.isLoggedIn, 
        user: req.session.user,
      });
    }
  });
};
