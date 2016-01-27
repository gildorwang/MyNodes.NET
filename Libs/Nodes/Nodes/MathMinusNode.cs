﻿//planer-pro copyright 2015 GPL - license.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyNetSensors.Nodes
{

    public class MathMinusNode : Node
    {
        /// <summary>
        /// Math Minus (2 inputs, 1 output).
        /// </summary>
        public MathMinusNode() : base(2, 1)
        {
            this.Title = "Math Minus";
            this.Type = "Math/Minus";

            Inputs[0].Type = DataType.Number;
            Inputs[1].Type = DataType.Number;
            Outputs[0].Type = DataType.Number;
        }

        public override void Loop()
        {
        }

        public override void OnInputChange(Input input)
        {
            if (Inputs.Any(i => i.Value == null))
            {
                LogInfo("[NULL]");
                Outputs[0].Value = null;
                return;
            }

            Double a = Double.Parse(Inputs[0].Value);
            Double b = Double.Parse(Inputs[1].Value);
            Double c = a - b;

            LogInfo($"[{a}] - [{b}] = [{c}]");
            Outputs[0].Value = c.ToString();
        }
    }
}