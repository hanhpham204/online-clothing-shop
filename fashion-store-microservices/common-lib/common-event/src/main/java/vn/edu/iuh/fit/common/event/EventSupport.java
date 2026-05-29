package vn.edu.iuh.fit.common.event;

import java.util.UUID;

final class EventSupport {
    private EventSupport() {
    }

    static String newEventId() {
        return UUID.randomUUID().toString();
    }
}
