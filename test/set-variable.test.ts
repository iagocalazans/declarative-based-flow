import { SetVariable, Flow } from "../src";
import { amazingSetVariableWidgetOne } from "./consts";

describe("Receives SetVariable widget's", () => {
  let flow: (a: any) => any;

  beforeAll(() => {
    amazingSetVariableWidgetOne.moveTo(
      SetVariable.create("amazing_set_variable_widget_two")
        .variable("myVarTwo", "{{ payload.act.like.this.should.be.this }}")
        .moveTo(
          SetVariable.create("amazing_set_variable_widget_three").variable(
            "myVarThree",
            "{{ payload.act.like.those }}",
          ),
        ),
    );

    flow = Flow.create("amazing_flow").start(amazingSetVariableWidgetOne).end();
  });

  it("should create a SetVariable widget", () => {
    const widget = SetVariable.create("amazing_set_variable_widget");
    expect(widget).toBeInstanceOf(SetVariable);
  });

  it("should run with three SetVariable widget's", () => {
    const payload = flow({
      act: {
        like: {
          that: "that",
          this: {
            should: {
              be: {
                this: "this",
              },
            },
          },
          those: "those",
        },
      },
    });

    expect(payload).resolves.toMatchObject({
      payload: {
        act: {
          like: {
            that: "that",
            this: {
              should: {
                be: {
                  this: "this",
                },
              },
            },
            those: "those",
          },
        },
      },
      variables: {
        myVarOne: "that",
        myVarTwo: "this",
        myVarThree: "those",
      },
    });
  });
});

describe("SetVariable with multiple variables on one widget", () => {
  it("accumulates every declared variable", async () => {
    const extract = SetVariable.create("extract_many")
      .variable("id", "{{ payload.user.id }}")
      .variable("email", "{{ payload.user.email }}")
      .variable("tier", "{{ payload.user.tier }}");

    const flow = Flow.create("multi_var_flow").start(extract).end();

    const result = await flow({
      user: { id: 7, email: "a@b.com", tier: "gold" },
    });

    expect(result.variables).toMatchObject({
      id: 7,
      email: "a@b.com",
      tier: "gold",
    });
  });
});
