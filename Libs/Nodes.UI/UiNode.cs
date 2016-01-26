﻿/*  MyNetSensors 
    Copyright (C) 2015 Derwish <derwish.pro@gmail.com>
    License: http://www.gnu.org/licenses/gpl-3.0.txt  
*/

namespace MyNetSensors.Nodes
{
    public abstract class UiNode : Node
    {
        public int PanelOrderIndex { get; set; }
        public string Name { get; set; }
        internal string DefaultName { get; set; }

        public bool ShowOnMainPage { get; set; }

        public string PanelName
        {
            get
            {
                if (PanelId == engine.MAIN_PANEL_ID)
                    return "Main Panel";

                return engine.GetPanelNode(PanelId)?.Name;
            }
        }

        public UiNode(int inputsCount, int outputsCount) : base(inputsCount, outputsCount)
        {
            ShowOnMainPage = true;
        }

    }
}
