import { SetVariable } from "../src";

export const amazingSetVariableWidgetOne = SetVariable
        .create('amazing_set_variable_widget_one')
        .variable('myVarOne', '{{ payload.act.like.that }}');