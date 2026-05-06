package com.voguestore.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

public class OrderCodeGenerator {

    private static final AtomicInteger counter = new AtomicInteger(0);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    public static String generate() {
        String date = LocalDate.now().format(DATE_FORMAT);
        int seq = counter.incrementAndGet() % 10000;
        int random = (int) (Math.random() * 1000);
        return String.format("ORD-%s-%04d%03d", date, seq, random);
    }
}
