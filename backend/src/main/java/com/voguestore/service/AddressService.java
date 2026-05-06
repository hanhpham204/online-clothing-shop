package com.voguestore.service;

import com.voguestore.dto.request.AddressRequest;
import com.voguestore.dto.response.AddressResponse;
import com.voguestore.entity.Address;
import com.voguestore.entity.User;
import com.voguestore.exception.BadRequestException;
import com.voguestore.exception.ResourceNotFoundException;
import com.voguestore.repository.AddressRepository;
import com.voguestore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public List<AddressResponse> getAddresses(Long userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AddressResponse createAddress(Long userId, AddressRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // If this is set as default, unset other defaults
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            addressRepository.findByUserIdOrderByIsDefaultDesc(userId)
                    .forEach(a -> { a.setIsDefault(false); addressRepository.save(a); });
        }

        // If this is the first address, make it default
        boolean isFirst = addressRepository.findByUserIdOrderByIsDefaultDesc(userId).isEmpty();

        Address address = Address.builder()
                .user(user)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .province(request.getProvince())
                .district(request.getDistrict())
                .ward(request.getWard())
                .streetAddress(request.getStreetAddress())
                .isDefault(isFirst || Boolean.TRUE.equals(request.getIsDefault()))
                .build();

        address = addressRepository.save(address);
        return toResponse(address);
    }

    @Transactional
    public AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to this user");
        }

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            addressRepository.findByUserIdOrderByIsDefaultDesc(userId)
                    .forEach(a -> { a.setIsDefault(false); addressRepository.save(a); });
        }

        address.setFullName(request.getFullName());
        address.setPhone(request.getPhone());
        address.setProvince(request.getProvince());
        address.setDistrict(request.getDistrict());
        address.setWard(request.getWard());
        address.setStreetAddress(request.getStreetAddress());
        address.setIsDefault(Boolean.TRUE.equals(request.getIsDefault()));

        address = addressRepository.save(address);
        return toResponse(address);
    }

    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to this user");
        }

        addressRepository.delete(address);

        // If we deleted the default, promote the first remaining
        if (Boolean.TRUE.equals(address.getIsDefault())) {
            List<Address> remaining = addressRepository.findByUserIdOrderByIsDefaultDesc(userId);
            if (!remaining.isEmpty()) {
                remaining.get(0).setIsDefault(true);
                addressRepository.save(remaining.get(0));
            }
        }
    }

    private AddressResponse toResponse(Address address) {
        return AddressResponse.builder()
                .id(address.getId())
                .fullName(address.getFullName())
                .phone(address.getPhone())
                .province(address.getProvince())
                .district(address.getDistrict())
                .ward(address.getWard())
                .streetAddress(address.getStreetAddress())
                .isDefault(address.getIsDefault())
                .build();
    }
}
