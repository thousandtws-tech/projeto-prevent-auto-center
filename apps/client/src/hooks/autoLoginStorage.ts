export const enableAutoLogin = () => {
  localStorage.setItem("auto_login", "true");
};

export const disableAutoLogin = () => {
  localStorage.setItem("auto_login", "false");
};
