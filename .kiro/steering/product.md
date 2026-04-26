# Product

This is a lingerie e-commerce platform backend API. It handles the full e-commerce lifecycle including product catalog management, customer accounts, shopping carts, order processing, payments, and product reviews.

## Core Domain Concepts

- **Products**: Lingerie items with variants (size/color combinations), pricing (cost + retail + markup), and categorization
- **Customers**: Registered users with addresses, gender, and marketing preferences
- **Cart**: Supports both guest (session-based) and authenticated (customer-based) shopping carts with abandoned cart tracking
- **Orders**: Full order lifecycle with status tracking, shipping/billing addresses, and itemized totals
- **Payments**: Payment records linked to orders with support for multiple payment methods
- **Reviews**: Customer product reviews with ratings
- **Wishlist**: Customers can save products for later
