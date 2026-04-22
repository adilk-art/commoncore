import {blockUserToggle,getAllUsers  } from "../../repositories/admin.repository.js";

export const getAllUsersService = async ({ search, page, sort }) => {
  const limit = 5;

  const result = await getAllUsers({
    search,
    page,
    limit,
    sort
  });

  return {
    ...result,
    currentPage: page,
    limit
  };
};

export const toggleUserBlockService=async(userId)=>{
    return await blockUserToggle(userId)
}

