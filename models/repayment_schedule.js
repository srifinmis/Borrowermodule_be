const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('repayment_schedule', {
    repayment_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    sanction_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: 'sanction_details',
        key: 'sanction_id'
      }
    },
    tranche_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: 'tranche_details',
        key: 'tranche_id'
      }
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    principal_due: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    interest_due: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    total_due: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    approval_status: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    createdby: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    createdat: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedby: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    updatedat: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lender_code: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'lender_master',
        key: 'lender_code'
      }
    }
  }, {
    sequelize,
    tableName: 'repayment_schedule',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "repayment_schedule_composite_idx",
        fields: [
          { name: "sanction_id" },
          { name: "tranche_id" },
          { name: "due_date" },
        ]
      },
      {
        name: "repayment_schedule_pkey",
        unique: true,
        fields: [
          { name: "repayment_id" },
        ]
      },
    ]
  });
};
