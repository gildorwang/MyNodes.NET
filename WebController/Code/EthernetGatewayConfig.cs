﻿/*  MyNodes.NET 
    Copyright (C) 2016 Derwish <derwish.pro@gmail.com>
    License: http://www.gnu.org/licenses/gpl-3.0.txt  
*/


namespace MyNodes.WebController.Code
{
    public class EthernetGatewayConfig
    {
        public bool Enable { get; set; }
        public string GatewayIP { get; set; }
        public int GatewayPort { get; set; }
    }
}
