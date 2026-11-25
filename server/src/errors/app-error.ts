export const CODE = {
  NOT_FOUND: 404,
};

export const notFoundError = () => {
  return Object.assign(new Error("找不到該Memo"), { status: CODE.NOT_FOUND });
};
