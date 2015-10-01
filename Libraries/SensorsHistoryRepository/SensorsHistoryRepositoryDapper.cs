﻿/*  MyNetSensors 
    Copyright (C) 2015 Derwish <derwish.pro@gmail.com>
    License: http://www.gnu.org/licenses/gpl-3.0.txt  
*/

using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Linq;
using System.Timers;
using Dapper;
using MyNetSensors.Gateway;

namespace MyNetSensors.SensorsHistoryRepository
{
    /// <summary>
    /// Repository can read sensors history. If gateway connected, it will store updated sensors history.
    /// </summary>
    public class SensorsHistoryRepositoryDapper : ISensorsHistoryRepository
    {
        //This value is interval for updateDbTimer in ms. 
        //When timer will elapsed, program will check all nodes,
        //which need to store in db (sensor.storeHistoryWithInterval), and will write them.
        //If storeHistoryWithInterval will be less then writeInterval, 
        //storeHistoryWithInterval will be equal to writeInterval
        //If you have tons of data, and db perfomance decreased, increase this value,
        //and you will get less writing to db frequency 
        public int writeInterval = 1000;


        private Timer updateDbTimer = new Timer();

        private SerialGateway gateway;

        private string connectionString;

        public SensorsHistoryRepositoryDapper(string connectionString)
        {
            this.connectionString = connectionString;
            // db = new SqlConnection(connectionString);
        }


        public bool IsDbExist()
        {
            //todo check if db exist
            return true;
        }

        public void ConnectToGateway(SerialGateway gateway)
        {
            this.gateway = gateway;

            gateway.OnSensorUpdatedEvent += OnSensorUpdatedEvent;

            updateDbTimer.Elapsed += UpdateDbTimer;

            updateDbTimer.Interval = writeInterval;
            updateDbTimer.Start();

        }

        public void SetWriteInterval(int ms)
        {
            writeInterval = ms;
            updateDbTimer.Stop();
            updateDbTimer.Interval = writeInterval;
            updateDbTimer.Start();
        }

        private void OnSensorUpdatedEvent(Sensor sensor)
        {
            if (sensor.storeHistoryEnabled && sensor.storeHistoryEveryChange)
                WriteSensorDataToHistory(sensor);
        }

        private void UpdateDbTimer(object sender, ElapsedEventArgs e)
        {
            updateDbTimer.Stop();
            try
            {

                List<Node> nodes = gateway.GetNodes();
                foreach (var node in nodes)
                {
                    foreach (var sensor in node.sensors)
                    {
                        if (!sensor.storeHistoryEnabled || sensor.storeHistoryWithInterval == 0)
                            continue;

                        TimeSpan elapsedTime = DateTime.Now.Subtract(sensor.storeHistoryLastDate);
                        if (elapsedTime.TotalSeconds >= sensor.storeHistoryWithInterval)
                        {
                            sensor.storeHistoryLastDate = DateTime.Now;
                            Debug.WriteLine(elapsedTime.TotalMilliseconds + " " + sensor.sensorId);
                            WriteSensorDataToHistory(sensor);
                        }
                    }
                }
            }
            catch { }
            updateDbTimer.Start();
        }


        public List<SensorData> GetSensorHistory(int db_Id)
        {
            using (var db = new SqlConnection(connectionString))
            {
                db.Open();
                string req = String.Format("SELECT * FROM SensorHistory{0}", db_Id);

                List<SensorData> list = null;
                try
                {
                    list = db.Query<SensorData>(req).ToList();
                }
                catch
                {
                }

                return list;
            }
        }



        public void DropSensorHistory(int db_Id)
        {
            using (var db = new SqlConnection(connectionString))
            {
                db.Open();

                try
                {
                    db.Query(String.Format("DROP TABLE [SensorHistory{0}]", db_Id));
                }
                catch { }
            }
        }

        public void DropAllSensorsHistory()
        {
            using (var db = new SqlConnection(connectionString))
            {
                db.Open();

                try
                {
                    db.Query(
                        @"  declare @sql varchar(8000) 
                            set @sql='' 
                            select @sql=@sql+' drop table '+table_name from INFORMATION_SCHEMA.TABLES where table_name like 'SensorHistory%[0-9.]' 
                            exec(@sql)");
                }
                catch { }
            }
        }


        private void WriteSensorDataToHistory(Sensor sensor)
        {
            using (var db = new SqlConnection(connectionString))
            {
                db.Open();

                CreateTableForSensor(sensor);

                List<SensorData> data = sensor.GetAllData();

                if (data == null)
                    return;

                foreach (var sensorData in data)
                    sensorData.dateTime = DateTime.Now;

                var sqlQuery = String.Format(
                    "INSERT INTO SensorHistory{0} (dataType, state, dateTime) "
                    + "VALUES(@dataType,@state, @dateTime); "
                    + "SELECT CAST(SCOPE_IDENTITY() as int)", sensor.db_Id);
                db.Execute(sqlQuery, data);

            }
        }

        private void CreateTableForSensor(Sensor sensor)
        {
            using (var db = new SqlConnection(connectionString))
            {
                db.Open();

                try
                {
                    string req = String.Format(
                        @"CREATE TABLE [dbo].[SensorHistory{0}](
	            [db_Id] [int] IDENTITY(1,1) NOT NULL,
	            [dataType] [int] NULL,	        
	            [state] [nvarchar](max) NULL,	        
	            [dateTime] [datetime] NOT NULL ) ON [PRIMARY] ", sensor.db_Id);

                    db.Query(req);
                }
                catch
                {
                }
            }
        }
    }
}