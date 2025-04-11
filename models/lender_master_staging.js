const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('lender_master_staging', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    lender_code: {
      type: DataTypes.STRING(10),
      allowNull: true
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
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "Approval Pending"
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
    createdby: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    updatedby: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    approval_status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "Approval Pending"
    },
    updated_fields: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    user_type: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'lender_master_staging',
    schema: 'staging',
    timestamps: false,
    indexes: [
      {
        name: "lms_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
