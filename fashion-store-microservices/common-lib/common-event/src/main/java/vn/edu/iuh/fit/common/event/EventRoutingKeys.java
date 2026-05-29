package vn.edu.iuh.fit.common.event;

public final class EventRoutingKeys {
    private EventRoutingKeys() {
    }

    public static final String EXCHANGE = "fashion.exchange";
    public static final String USER_REGISTERED = "user.registered";
    public static final String PRODUCT_UPDATED = "product.updated";
    public static final String ORDER_CREATED = "order.created";
    public static final String INVENTORY_RESERVED = "inventory.reserved";
    public static final String INVENTORY_FAILED = "inventory.failed";
    public static final String PAYMENT_COMPLETED = "payment.completed";
    public static final String PAYMENT_FAILED = "payment.failed";
    public static final String ORDER_PAID = "order.paid";
    public static final String ORDER_CANCELLED = "order.cancelled";
    public static final String CART_CLEARED = "cart.cleared";
    public static final String DLX_EXCHANGE = "fashion.dlx";
}
