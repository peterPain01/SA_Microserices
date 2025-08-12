package com.devteria.identity.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.devteria.identity.dto.request.UserCreationRequest;
import com.devteria.identity.dto.request.UserUpdateRequest;
import com.devteria.identity.dto.response.UserResponse;
import com.devteria.identity.entity.AppUser;

@Mapper(componentModel = "spring")
public interface UserMapper {
    AppUser toUser(UserCreationRequest request);

    UserResponse toUserResponse(AppUser user);

    @Mapping(target = "usersRoles", ignore = true)
    void updateUser(@MappingTarget AppUser user, UserUpdateRequest request);
}
