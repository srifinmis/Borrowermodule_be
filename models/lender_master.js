const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('lender_master', {
    lender_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    lender_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    lender_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    lender_address_1: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    lender_address_2: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    lender_address_3: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    lender_contact_1: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    lender_contact_2: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    lender_contact_3: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    lender_email_id_1: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    lender_email_id_2: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    lender_email_id_3: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    lender_spoc_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    lender_spoc_contact: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    lender_spoc_email: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    lender_escalation_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    lender_escalation_contact: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    lender_escalation_email: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    createdat: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedat: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    approval_status: {
      type: DataTypes.STRING(30),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'lender_master',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "lender_master_composite_idx",
        fields: [
          { name: "lender_code" },
          { name: "approval_status" },
        ]
      },
      {
        name: "lender_master_pkey",
        unique: true,
        fields: [
          { name: "lender_code" },
        ]
      },
    ]
  });
};
