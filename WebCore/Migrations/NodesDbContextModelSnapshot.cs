using System;
using MyNodes.Repositories.EF.SQLite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace WebController.Migrations
{
    [DbContext(typeof(MySensorsNodesDbContext))]
    partial class NodesDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
            modelBuilder
                .HasAnnotation("ProductVersion", "7.0.0-rc1-16348");

            modelBuilder.Entity("MyNetSensors.LogicalNodes.LogicalLink", b =>
                {
                    b.Property<string>("Id");

                    b.Property<string>("InputId");

                    b.Property<string>("OutputId");

                    b.HasKey("Id");
                });

            modelBuilder.Entity("MyNetSensors.Repositories.EF.SQLite.LogicalNodeSerialized", b =>
                {
                    b.Property<string>("Id");

                    b.Property<string>("JsonData");

                    b.HasKey("Id");
                });
        }
    }
}
