package com.fashion.shop.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Product {

    @Id
    private String id;

    private String name;
    private double price;
    private int stock;
}
