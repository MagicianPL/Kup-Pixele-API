const stripe = require("stripe")(process.env.STRIPE_SECRET_API);
const PlaceOrder = require("../models/PlaceOrderModel");

const createCheckoutSession = async (
  user,
  qty,
  name,
  url,
  description,
  background,
  userId,
  buyedPlaces
) => {
  const session = await stripe.checkout.sessions.create(
    {
      payment_method_types: ["card", "p24"],
      mode: "payment",
      customer_email: user?.email || "test@test.com",
      payment_intent_data: {
        metadata: {
          email: user?.email || "test@test.com",
          totalPriceInGrosz: qty * 1000,
          name,
          url,
          description,
          background,
          userId,
        },
      },
      line_items: [
        {
          price_data: {
            currency: "pln",
            unit_amount: 1000,
            product_data: {
              name: "Pixelowe Miejsce",
            },
          },
          quantity: qty,
        },
      ],
      expires_at: Math.ceil(Date.now() / 1000) + 3720,
      success_url: "https://magicianpl.github.io/Kup-Pixele/",
      cancel_url: "https://magicianpl.github.io/Kup-Pixele/",
    },
    {
      stripeAccount: "acct_1KQfEbCOnznOsZux",
    }
  );
  /* Creating order on DataBase */
  await PlaceOrder.create({
    paymentIntentId: session.payment_intent,
    places: buyedPlaces,
    costInGrosz: qty * 1000,
  });

  console.log(session);
  //setting session expiring funcionality if is not paid after specific time - 12 minutes
  setTimeout(async () => {
    const returnedSession = await stripe.checkout.sessions.retrieve(session.id);
    if (returnedSession.status === "complete") {
      return;
    } else {
      stripe.checkout.sessions.expire(session.id);
    }
  }, 720000);
  return session.url;
};

module.exports = createCheckoutSession;
