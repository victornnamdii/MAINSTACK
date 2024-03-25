import chai, { expect } from "chai";
import { beforeEach, after, describe, it } from "mocha";
import chaiHttp from "chai-http";
import dotenv from "dotenv";
import app from "../src/server";
import User from "../src/models/User";
import Category from "../src/models/Category";

dotenv.config();
chai.use(chaiHttp);

const email = "abcdefghijklmnopqrstuvwxyz@gmail.com";
const email2 = "asdfghj@gmail.com";
const categoryName = "Asdfghjuytfvbnm";

let token: string;
let categoryId: string;

describe("API Tests", function () {
  beforeEach(() => {});

  after(async () => {
    await User.deleteOne({ $or: [{ email }, { eamil: email2 }] });
    await Category.deleteOne({ name: categoryName });
  });

  describe("Auth Tests", () => {
    describe("Sign Up", () => {
      it("should register account", async () => {
        const res = await chai.request(app).post("/api/v1/auth/signup").send({
          email,
          password: "123456",
          firstName: "John",
          lastName: "Doe",
        });

        expect(res).to.have.status(201);
        expect(res.body.message).to.equal("New user successfully created");
        expect(res.body.data.email).to.equal(email);
      });
    });

    describe("Log in", () => {
      it("should log in user", async () => {
        const res = await chai.request(app).post("/api/v1/auth/login").send({
          email,
          password: "123456",
        });

        expect(res).to.have.status(200);
        expect(res.body.token).to.exist;

        token = res.body.token;
      });
    });

    describe("Delete Account", () => {
      it("should delete account", async () => {
        const res = await chai.request(app).post("/api/v1/auth/signup").send({
          email: email2,
          password: "123456",
          firstName: "John",
          lastName: "Doe",
        });

        expect(res).to.have.status(201);
        expect(res.body.message).to.equal("New user successfully created");
        expect(res.body.data.email).to.equal(email2);

        const res2 = await chai.request(app).post("/api/v1/auth/login").send({
          email: email2,
          password: "123456",
        });

        expect(res2).to.have.status(200);
        expect(res2.body.token).to.exist;

        const res3 = await chai
          .request(app)
          .delete("/api/v1/auth/user")
          .set("Authorization", `Bearer ${res2.body.token}`);

        expect(res3).to.have.status(200);
      });
    });

    describe("Update Account", () => {
      it("should update account", async () => {
        const res = await chai
          .request(app)
          .patch("/api/v1/auth/user")
          .send({
            email,
            password: "123456",
            firstName: "John",
            lastName: "Doe",
          })
          .set("Authorization", `Bearer ${token}`);

        expect(res).to.have.status(201);
        expect(res.body.data.email).to.equal(email);
      });
    });

    describe("Get User Profile", () => {
      it("should get user profile", async () => {
        const res = await chai
          .request(app)
          .get("/api/v1/auth/user")
          .set("Authorization", `Bearer ${token}`);

        expect(res).to.have.status(200);
        expect(res.body.data.email).to.equal(email);
      });
    });
  });

  describe("Category Tests", () => {
    describe("Add category", () => {
      it("should add category", async () => {
        const res = await chai
          .request(app)
          .post("/api/v1/categories")
          .send({ name: categoryName })
          .set("Authorization", `Bearer ${token}`);

        expect(res).to.have.status(201);
        expect(res.body.data.name).to.equal(categoryName);

        categoryId = res.body.data._id;
      });
    });

    describe("Update", () => {
      it("should update category", async () => {
        const res = await chai
          .request(app)
          .put(`/api/v1/categories/${categoryId}`)
          .send({ name: categoryName })
          .set("Authorization", `Bearer ${token}`);

        expect(res).to.have.status(201);
        expect(res.body.data.name).to.exist;
      });
    });

    describe("Get Categories", () => {
      it("should get categories", async () => {
        const res = await chai
          .request(app)
          .get("/api/v1/categories")
          .set("Authorization", `Bearer ${token}`);

        expect(res).to.have.status(200);
        expect(res.body.data).to.be.an("array");
        expect(res.body.metadata).to.be.an("object");
      });
    });

    describe("Get Category", () => {
      it("should get a category", async () => {
        const res = await chai
          .request(app)
          .get(`/api/v1/categories/${categoryId}`)
          .set("Authorization", `Bearer ${token}`);

        expect(res).to.have.status(200);
        expect(res.body.data).to.be.an("object");
      });

      it("should get a category and include 5 of it's products", async () => {
        const res = await chai
          .request(app)
          .get(`/api/v1/categories/${categoryId}?include=products`)
          .set("Authorization", `Bearer ${token}`);

        expect(res).to.have.status(200);
        expect(res.body.data).to.be.an("object");
        expect(res.body.data.category_products).to.be.an("array");
        expect(res.body.data.category_products.length <= 5).to.equal(true);
      });
    });

    describe("Get Category", () => {
      it("should get a category's product", async () => {
        const res = await chai
          .request(app)
          .get(`/api/v1/categories/${categoryId}/products`)
          .set("Authorization", `Bearer ${token}`);

        expect(res).to.have.status(200);
        expect(res.body.metadata).to.be.an("object");
        expect(res.body.data).to.be.an("array");
      });
    });

    describe("Delete Category", () => {
      it("should delete category", async () => {
        const res3 = await chai
          .request(app)
          .delete(`/api/v1/categories/${categoryId}`)
          .set("Authorization", `Bearer ${token}`);

        expect(res3).to.have.status(200);
      });
    });
  });
});
