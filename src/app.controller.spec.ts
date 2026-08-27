import { AppController } from "./app.controller";

describe("AppController", () => {
  const controller = new AppController();

  it("reports that the API is running", () => {
    expect(controller.getInfo()).toEqual({
      name: "Ninho API",
      version: "1.0.0",
      status: "running",
    });
  });

  it("reports a healthy status", () => {
    expect(controller.getHealth()).toEqual(
      expect.objectContaining({ status: "ok" }),
    );
  });
});
