const inquirer = require('inquirer');

const db = require('./db/connection');

require("console.table");

const optionList = [
    {
      type: 'list',
      message: 'What would you like to do?',
      choices: ['View All Departments', 'Add Department', 'Delete Department', 'View All Roles', 'Add Role', 'Delete Role', 'View All Employees', 'Add Employee', 'Delete Employee', 'Update Employee Role', "Update Employee's Manager", 'View Employee By Department', 'Exit'],
      name: 'optionView',
    },
  ];
  
  async function init() {
    try {
      const answers = await inquirer.prompt(optionList);
      const options = {
        'View All Departments': viewAllDepartments,
        'Add Department': addDepartment,
        'Delete Department': deleteDepartment,
        'View All Roles': viewAllRoles,
        'Add Role': addRole,
        'Delete Role': deleteRole,
        'View All Employees': viewAllEmployees,
        'Add Employee': addEmployee,
        'Delete Employee': deleteEmployee,
        'Update Employee Role': updateEmployeeRole,
        "Update Employee's Manager": updateEmployeeManager,
        'View Employee By Department': viewEmployeeByDepartment,
        'Exit': exitProgram,
      };
      const selectedOption = options[answers.optionView];
      if (selectedOption) {
        await selectedOption();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  function exitProgram() {
    console.log('Exiting');
    process.exit();
  }
  
async function viewAllDepartments() {
    try {
      const [rows, fields] = await db.promise().query('SELECT * FROM department');
      console.log('Showing all departments.');
      console.table(rows);
    } catch (error) {
      console.error('Error showing all departments.', error);
    } finally {
      init();
    }
}
  
async function addDepartment() {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'departmentName',
          message: 'What is the name of the department?',
          validate: function (input) {
            return input.trim() ? true : "Department name cannot be empty.";
          },
        },
      ]);
  
      await db.promise().query('INSERT INTO department (name) VALUES (?)', [answers.departmentName]);
      console.log('Department added successfully.');
  
      const [departments] = await db.promise().query('SELECT * FROM department');
      const departmentChoices = departments.map(department => department.name);
  
      optionList.forEach(option => {
        if (['Add Role', 'Delete Department', 'Add Employee', "Update Employee's Manager", 'View Employee By Department'].includes(option.name)) {
          option.choices = departmentChoices;
        }
      });
  
      console.table(departments);
    } catch (error) {
      console.error('Error adding department.', error);
    } finally {
      init();
    }
}

async function deleteDepartment() {
    try {
      const [departments] = await db.promise().query('SELECT * FROM department');
      const departmentChoices = departments.map(department => ({
        name: department.name,
        value: department.id,
      }));
  
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'departmentId',
          message: 'Which department do you want to delete?',
          choices: departmentChoices,
        },
      ]);
  
      await db.promise().query('DELETE FROM department WHERE id = ?', [answers.departmentId]);
      console.log('Department deleted successfully.');
      viewAllDepartments();
    } catch (error) {
      console.error('Error deleting department.', error);
    } finally {
      init();
    }
}

async function viewAllRoles() {
    try {
      const [rows, fields] = await db.promise().query('SELECT * FROM role');
      console.log('Showing all roles successfully.');
      console.table(rows);
    } catch (error) {
      console.error('Error viewing all roles.', error);
    } finally {
      init();
    }
}
  
async function addRole() {
    try {
      const [departments] = await db.promise().query('SELECT * FROM department');
      const departmentChoices = departments.map(department => ({
        name: department.name,
        value: department.id,
      }));
  
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'roleName',
          message: 'What is the name of the role?',
          validate: input => input.trim() ? true : 'Role name cannot be empty.',
        },
        {
          type: 'input',
          name: 'salary',
          message: 'What is the salary of the role?',
          validate: input => {
            const parsedSalary = parseFloat(input);
            return isNaN(parsedSalary) || parsedSalary <= 0 ? 'Invalid salary. Please enter a valid positive number.' : true;
          },
        },
        {
          type: 'list',
          name: 'addRoleDepartment',
          message: 'Which department does the role belong to?',
          choices: departmentChoices,
        },
      ]);
  
      await db.promise().query('INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)', [answers.roleName, answers.salary, answers.addRoleDepartment]);
      console.log('Role added successfully.');
  
      viewAllRoles();
    } catch (error) {
      console.error('Error adding role.', error);
    } finally {
      init();
    }
}
  
async function deleteRole() {
    try {
      const [roles] = await db.promise().query('SELECT * FROM role');
      const roleChoices = roles.map(role => ({
        name: role.title,
        value: role.id,
      }));
  
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'roleId',
          message: 'Which role do you want to delete?',
          choices: roleChoices,
        },
      ]);
  
      await db.promise().query('DELETE FROM role WHERE id = ?', [answers.roleId]);
  
      console.log('Role deleted successfully.');
      viewAllRoles();
    } catch (error) {
      console.error('Error deleting role.', error);
    } finally {
      init();
    }
}

async function viewAllEmployees() {
    try {
      const query = `
        SELECT e.id, e.first_name, e.last_name, r.title AS title, d.name AS department, r.salary, CONCAT(m.first_name, " ", m.last_name) AS manager 
        FROM employee e 
        LEFT JOIN role r ON e.role_id = r.id 
        LEFT JOIN department d ON r.department_id = d.id 
        LEFT JOIN employee m ON e.manager_id = m.id`;
  
      const [rows, fields] = await db.promise().query(query);
  
      console.log('Showing all employees successfully.');
      console.table(rows);
    } catch (error) {
      console.error('Error showing all employees.', error);
    } finally {
      init();
    }
}

async function addEmployee() {
    try {
      const [roles] = await db.promise().query('SELECT * FROM role');
      const [managers] = await db.promise().query('SELECT * FROM employee WHERE manager_id IS NULL');
  
      const roleChoices = roles.map(role => ({
        name: role.title,
        value: role.id,
      }));
  
      const managerChoices = [
        ...managers.map(manager => ({
          name: `${manager.first_name} ${manager.last_name}`,
          value: manager.id,
        })),
        {
          name: 'None',
          value: null,
        },
      ];
  
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'firstName',
          message: "What is the employee's first name?",
        },
        {
          type: 'input',
          name: 'lastName',
          message: "What is the employee's last name?",
        },
        {
          type: 'list',
          name: 'employeeRole',
          message: "What is the employee's role?",
          choices: roleChoices,
        },
        {
          type: 'list',
          name: 'employeeManager',
          message: "Who is the employee's manager?",
          choices: managerChoices,
        },
      ]);
  
      await db.promise().query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)', [answers.firstName, answers.lastName, answers.employeeRole, answers.employeeManager]);
      console.log('Employee added successfully.');
      viewAllEmployees();
    } catch (error) {
      console.error('Error adding employee.', error);
    } finally {
      init();
    }
}

async function deleteEmployee() {
    try {
      const [employees] = await db.promise().query('SELECT * FROM employee');
  
      const employeeChoices = employees.map(employee => ({
        name: `${employee.first_name} ${employee.last_name}`,
        value: employee.id,
      }));
  
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'employeeId',
          message: 'Which employee do you want to delete?',
          choices: employeeChoices,
        },
      ]);
  
      await db.promise().query('DELETE FROM employee WHERE id = ?', [answers.employeeId]);
      console.log('Employee deleted successfully.');
      viewAllEmployees();
    } catch (error) {
      console.error('Error deleting employee.', error);
    } finally {
      init();
    }
}
 
async function updateEmployeeRole() {
    try {
      const [employees] = await db.promise().query('SELECT * FROM employee');
      const [roles] = await db.promise().query('SELECT * FROM role');
  
      const employeeChoices = employees.map(employee => ({
        name: `${employee.first_name} ${employee.last_name}`,
        value: employee.id,
      }));
  
      const roleChoices = roles.map(role => ({
        name: role.title,
        value: role.id,
      }));
  
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'employeeId',
          message: "Which employee's role do you want to update? ('View All Employees' first to see existing employees.)",
          choices: employeeChoices,
        },
        {
          type: 'list',
          name: 'newRole',
          message: "What is the employee's new role?",
          choices: roleChoices,
        },
      ]);
  
      await db.promise().query('UPDATE employee SET role_id = ? WHERE id = ?', [answers.newRole, answers.employeeId]);
      console.log("Employee's role updated successfully.");
      viewAllEmployees();
    } catch (error) {
      console.error("Error updating employee's role.", error);
    } finally {
      init();
    }
}

async function updateEmployeeManager() {
    try {
      const [employees] = await db.promise().query('SELECT * FROM employee');
      const [managers] = await db.promise().query('SELECT * FROM employee WHERE manager_id IS NULL');
  
      const employeeChoices = employees.map(employee => ({
        name: `${employee.first_name} ${employee.last_name}`,
        value: employee.id,
      }));
  
      const managerChoices = [
        ...managers.map(manager => ({
          name: `${manager.first_name} ${manager.last_name}`,
          value: manager.id,
        })),
        {
          name: 'None',
          value: null,
        },
      ];
  
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'employeeId',
          message: "Which employee's manager do you want to update? ('View All Employees' first to see existing employees.)",
          choices: employeeChoices,
        },
        {
          type: 'list',
          name: 'newManager',
          message: "Who is the employee's new manager?",
          choices: managerChoices,
        },
      ]);
  
      await db.promise().query('UPDATE employee SET manager_id = ? WHERE id = ?', [answers.newManager, answers.employeeId]);
      console.log("Employee's manager updated successfully.");
      viewAllEmployees();
    } catch (error) {
      console.error("Error updating employee's manager.", error);
    } finally {
      init();
    }
}

async function viewEmployeeByDepartment() {
    try {
      const [rows, fields] = await db.promise().query(`
        SELECT d.name AS department, e.first_name, e.last_name, r.title AS title 
        FROM employee e 
        JOIN role r ON e.role_id = r.id 
        JOIN department d ON r.department_id = d.id`);
  
      console.log('Displaying employees by department successfully.');
      console.table(rows);
    } catch (error) {
      console.error('Error viewing employees by department.', error);
    } finally {
      init();
    }
}

init();


  
  
  
  
  
  

  